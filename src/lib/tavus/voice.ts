/**
 * Voix de Julie — préparation d'une voix française native.
 *
 * ## Ce que `properties.language: "french"` corrige, et ce qu'il ne corrige pas
 *
 * Le réglage `language` envoyé à la création de conversation garantit la
 * **langue** : Julie comprend et répond en français. Il ne change **ni le
 * timbre ni l'accent** du modèle vocal. Si la voix configurée sur le PAL Tavus
 * est anglophone, Julie continuera de parler français avec un accent anglais.
 *
 * La suppression complète de cet accent exige une **voix native française**
 * (Tavus, ElevenLabs ou Cartesia) associée au PAL. C'est un changement de
 * configuration du PAL publié, pas un correctif applicatif.
 *
 * ## Architecture prête, désactivée par défaut
 *
 * Ce module lit uniquement des variables **serveur** (aucun préfixe
 * `NEXT_PUBLIC_`, aucune clé écrite dans le dépôt). Tant que les trois
 * variables ne sont pas définies, il renvoie `null` : le repli reste la voix
 * Tavus Auto actuelle, stable et déjà facturée dans le forfait.
 *
 * Variables attendues, le jour où la bascule est décidée :
 * - `ELEVENLABS_API_KEY`
 * - `ELEVENLABS_VOICE_ID`  (une voix française native)
 * - `ELEVENLABS_MODEL_ID`  (par défaut `eleven_flash_v2_5`)
 *
 * Le rattachement d'une voix se fait au niveau du **PAL / persona** Tavus, pas
 * au niveau d'une conversation : ce module n'est donc volontairement pas branché
 * sur `POST /api/tavus/conversations`. Il expose la configuration au futur
 * script de provisionnement du PAL, sans jamais l'activer tout seul.
 */

const DEFAULT_MODEL_ID = "eleven_flash_v2_5";

export interface ElevenLabsVoiceConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

/**
 * Renvoie la configuration ElevenLabs si — et seulement si — elle est
 * complètement fournie côté serveur. `null` sinon : aucune activation
 * implicite, aucun appel partiel.
 *
 * La valeur retournée contient un secret : ne jamais la journaliser ni la
 * renvoyer au navigateur.
 */
export function readElevenLabsVoiceConfig(): ElevenLabsVoiceConfig | null {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) return null;

  return {
    apiKey,
    voiceId,
    modelId: process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID,
  };
}

/** Indique, sans exposer aucun secret, si une voix native est configurée. */
export function hasNativeFrenchVoiceConfigured(): boolean {
  return readElevenLabsVoiceConfig() !== null;
}
