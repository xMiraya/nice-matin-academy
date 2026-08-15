# Audit de configuration Tavus — latence et naturel de Julie

Document de **diagnostic**. Aucun réglage n'est appliqué automatiquement par
l'application : le Face ID et le PAL ID restent ceux configurés dans
l'environnement serveur (`TAVUS_FACE_ID`, `TAVUS_PAL_ID`), et aucune clé n'est
exposée ici. Les modifications ci-dessous se font depuis le tableau de bord
Tavus ou via `PATCH /v2/personas/{pal_id}`, manuellement.

Noms de propriétés vérifiés dans la documentation Tavus CVI (pages
`pal/conversational-flow`, `pal/llm`, `pal/tts`, `pal/perception`) le
15 août 2026. Aucun SDK Tavus n'est installé dans le dépôt : l'intégration est
purement REST (`app/api/tavus/conversations/route.ts`), il n'existe donc aucun
type local à confronter — la documentation en ligne fait foi.

## 1. Réglages à vérifier manuellement

Structure attendue du PAL (extrait, valeurs cibles) :

```json
{
  "pipeline_mode": "full",
  "default_face_id": "<Face ID Phoenix-4 existant — ne pas changer sans décision>",
  "layers": {
    "perception": {
      "perception_model": "raven-1"
    },
    "conversational_flow": {
      "turn_detection_model": "sparrow-1",
      "turn_taking_patience": "low",
      "pal_interruptibility": "medium",
      "voice_isolation": "near"
    },
    "llm": {
      "speculative_inference": true
    },
    "tts": {
      "tts_emotion_control": true
    }
  }
}
```

| Réglage | Chemin exact | Valeurs admises | Cible | Effet attendu |
|---|---|---|---|---|
| Mode pipeline | `pipeline_mode` | `full`, `echo`, … | `full` | Active perception + flux conversationnel. Requis pour tout le reste. |
| Face | `default_face_id` | identifiant | Phoenix-4, idéalement une réplique **Pro** | Micro-expressions, mouvements de tête, regard. |
| Perception | `layers.perception.perception_model` | `raven-1`, `off` | `raven-1` | Julie perçoit le commercial ; permet des réactions contextuelles. |
| Détection de tour | `layers.conversational_flow.turn_detection_model` | `sparrow-1`, `sparrow-0`, `timebased` | `sparrow-1` | Détection de fin de parole nettement plus rapide et plus juste. |
| Patience | `layers.conversational_flow.turn_taking_patience` | `low`, `medium`, `high` | `low` (compromis : `medium`) | `low` réduit directement le silence avant réponse ; risque de couper une phrase hésitante. À arbitrer avec les mesures (§3). |
| Interruptibilité | `layers.conversational_flow.pal_interruptibility` | `low`, `medium`, `high` | `medium` | Julie peut être coupée sans s'arrêter à chaque bruit. |
| Isolation vocale | `layers.conversational_flow.voice_isolation` | `near`, `off` | `near` | Ignore les voix de fond en open space, évite les faux tours. |
| Émotion TTS | `layers.tts.tts_emotion_control` | booléen | `true` | Prosodie expressive : le point clé du « moins artificiel » côté voix. |
| Inférence spéculative | `layers.llm.speculative_inference` | booléen | `true` | Le LLM commence à traiter avant la fin de la phrase du commercial. Gain de latence majeur. |

### Écarts de nommage à connaître

- **`pal_interruptibility`** est le nom courant. `replica_interruptibility` est
  un **alias déprécié** : la consigne initiale mentionnait cette forme, c'est
  bien `pal_interruptibility` qu'il faut écrire.
- Les événements de parole ont eux aussi migré : `properties.role` vaut `"pal"`,
  avec un doublon hérité `"replica"`. L'instrumentation accepte les deux.
- `tts_emotion_control` et `speculative_inference` valent déjà `true` par
  défaut : **vérifier qu'ils n'ont pas été désactivés** plutôt que supposer
  qu'ils manquent.

## 2. Voix

`properties.language: "french"` (envoyé à la création de conversation) garantit
la langue, pas le timbre. Une voix anglophone rattachée au PAL produira un
français à l'accent anglais, et une prosodie plate malgré
`tts_emotion_control`. Cible : `layers.tts.tts_engine` en `cartesia` ou
`elevenlabs` avec un `external_voice_id` de **voix féminine native française**,
et `voice_settings` réglés pour un débit naturel. L'architecture côté serveur
est déjà prête et volontairement inactive (`src/lib/tavus/voice.ts`).

## 3. Mesures désormais disponibles côté application

`src/lib/tavus/latency-metrics.ts` instrumente l'appel **en développement
uniquement** (`process.env.NODE_ENV !== "production"` ; en production
l'enregistreur est inerte). Les logs `[latence Julie]` de la console
contiennent exclusivement des **noms d'événements, horodatages relatifs et
durées** — jamais de paroles, de transcript, de prompt ni de clé. Le champ
`properties` des messages Tavus n'est lu que pour `role`.

Événements suivis :

| Étape mesurée | Source |
|---|---|
| Fin de parole du commercial | `app-message` Tavus `conversation.stopped_speaking`, `role: "user"` |
| Utterance utilisateur transcrite | `app-message` Tavus `conversation.utterance` |
| Début de parole de Julie | `app-message` Tavus `conversation.started_speaking`, `role: "pal"` / `"replica"` |
| Fin de parole de Julie | `conversation.stopped_speaking`, rôle Julie |
| Cycle de vie de la salle | Daily `joined-meeting`, `participant-joined`, marqueur interne `julie-ready` |

Durées calculées à chaque tour : `transcriptionMs` (fin de parole →
transcription), `responseMs` (transcription → parole de Julie) et **`totalMs`
(fin de parole du commercial → début de parole de Julie)**, la mesure qui
compte. Le dernier tour s'affiche en surimpression discrète de la scène vidéo,
hors production.

Cette décomposition permet d'attribuer la latence : un `transcriptionMs` élevé
pointe vers `turn_detection_model` / `turn_taking_patience`, un `responseMs`
élevé vers le LLM (prompt trop long, `speculative_inference` désactivé).

## 4. Qualité réseau

Un indicateur discret s'affiche sur la scène vidéo uniquement quand la qualité
se dégrade, à partir de l'événement Daily `network-quality-change`
(`threshold`: `good` / `low` / `very-low`). Aucun coût, aucune attente.

`callObject.testCallQuality()` **n'a pas été branché** : le test dure jusqu'à
trente secondes, exige son propre call object — Daily n'en autorise qu'un à la
fois — et imposerait cette attente avant chaque appel. S'il devient nécessaire,
l'intégration propre est un bouton facultatif « Tester ma connexion » sur la
page d'accueil de l'appel, avant toute création de conversation Tavus.

## 5. Ce qui dépend de la réplique, et ce qui n'en dépend pas

**Nécessite une réplique Phoenix-4 (idéalement Pro)**

- Micro-expressions faciales, clignements, regard, mouvements de tête.
- Corrélation entre le ton émotionnel du texte et l'expression du visage.
- Rendu des silences et hésitations autrement que par un visage figé.

**Améliorable sans changer d'avatar**

- Latence : `sparrow-1`, `turn_taking_patience: low`, `speculative_inference`,
  prompt raccourci (voir §6).
- Naturel vocal : voix native française + `tts_emotion_control`.
- Naturel comportemental : règles émotionnelles et longueur de réponse dans le
  prompt (`docs/PAL_JULIE_PROMPT_OPTIMISE.md`) — 1 à 3 phrases, moins de
  40 mots, une seule question à la fois. Un prospect qui répond court paraît
  déjà nettement plus humain qu'un prospect qui récite.
- Perception : `raven-1` permet à Julie de réagir à l'attitude du commercial.
- Perçu côté interface : chronomètre démarré seulement quand Julie est présente,
  états de préparation explicites, scène vidéo mémoïsée.

## 6. Longueur du prompt

Tavus documente une dégradation des performances **et** de l'intelligence
au-delà de **5 000 tokens** de prompt (≈ 20 000 caractères). Un prompt long
augmente le temps jusqu'au premier token à chaque tour : c'est un levier de
latence direct. La version consolidée est dans
`docs/PAL_JULIE_PROMPT_OPTIMISE.md`.

## 7. Ordre de vérification recommandé

1. `speculative_inference: true` et `tts_emotion_control: true` (gratuits, immédiats).
2. `turn_detection_model: sparrow-1` puis `turn_taking_patience: low`.
3. Remplacement du prompt maître par la version consolidée.
4. Mesure de `totalMs` sur cinq à dix tours en développement, avant et après.
5. Voix native française.
6. Réplique Phoenix-4 Pro, en dernier — c'est le seul point à coût matériel.
