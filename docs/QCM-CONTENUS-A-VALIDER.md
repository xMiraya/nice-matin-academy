# Contenus a valider par l'equipe formation Nice-Matin

Ce document liste tout ce qui, dans l'application, doit etre relu, confirme ou
corrige **avant toute diffusion aux commerciaux**.

> **Contexte de production.** Aucun document Nice-Matin (methode commerciale,
> grille tarifaire, argumentaire, procedures internes) n'etait disponible au
> moment de la creation de cette banque pedagogique. Les contenus reposent donc
> exclusivement sur des bonnes pratiques commerciales generales. **Aucune offre,
> aucun tarif, aucune promotion et aucune procedure interne reelle n'y figure**,
> et rien n'a ete invente pour combler ces absences.

---

## 1. Regles commerciales non confirmees

| Sujet | Ce que dit l'application | A confirmer |
|---|---|---|
| Structure de l'entretien | Prise de contact -> ecoute -> decouverte -> reformulation -> argumentation -> objections -> conclusion | Est-ce la sequence de reference chez Nice-Matin ? |
| Nombre de benefices a presenter | Deux a trois maximum | Existe-t-il une consigne interne differente ? |
| Nombre d'informations minimales avant de presenter une offre | Quatre | A caler sur la trame de decouverte officielle |
| Interdiction de toute remise hors grille | Absolue dans toutes les questions | Confirmer qu'aucune marge de negociation n'existe |
| Interdiction du denigrement des concurrents et des medias gratuits | Absolue | Confirmer la formulation attendue |

## 2. Offres et contenu editorial a verifier

Aucune offre nommee n'apparait dans l'application. Les questions parlent de
« formule », « acces numerique », « offre couplee » sans les decrire.

A fournir pour une version diffusable :

- la liste exacte des formules commercialisees et leur perimetre ;
- ce qui est inclus et ce qui ne l'est pas, formule par formule ;
- le vocabulaire officiel a employer (les termes actuels sont generiques) ;
- les rubriques et couvertures editoriales pouvant etre citees en argument.

## 3. Tarifs

**Aucun tarif ne figure dans l'application, volontairement.** Plusieurs questions
enseignent la regle « ne jamais approximer un tarif » sans jamais en citer un.

A fournir : la grille tarifaire officielle, si l'equipe formation souhaite des
questions portant sur des montants reels. Dans ce cas, ces questions devront
etre revues a chaque changement tarifaire.

## 4. Formulations sensibles a relire

Les questions suivantes portent sur des sujets ou une formulation approximative
peut engager l'entreprise. Elles sont marquees `needsNiceMatinReview: true` dans
le code et affichent la source « A VALIDER AVEC L'EQUIPE FORMATION NICE-MATIN ».

- **Origine des fichiers de prospection** (`t-c1-06`, `n2-15`) : quelle reponse
  exacte le commercial doit-il donner a « comment avez-vous eu mon numero ? » ?
- **Droit d'opposition et non-sollicitation** (`t-c6-11`, `n4-04`, `n5-18`) :
  quelle est la procedure interne exacte ?
- **Refus de communiquer des donnees** (`t-c3-13`, `t-c6-07`, `n3-12`, `n4-12`) :
  quelles donnees sont reellement indispensables a une souscription ?
- **Preuve d'identite face a une suspicion d'arnaque** (`t-c6-08`, `n3-03`) :
  quel moyen de verification officiel indiquer au prospect ?
- **Objection sur la ligne editoriale** (`t-c6-13`, `n4-28`) : que le commercial
  est-il autorise a repondre ?
- **Objection sur la sante economique du groupe** (`n5-11`) : que le commercial
  est-il autorise a dire ?
- **Frequence de recontact** (`t-c4-14`, `n4-31`) : quelle regle s'applique ?
- **Procedure de resiliation / retractation** (`n5-35`, `t-c8-06`, `n3-10`) :
  quelle est la procedure exacte a annoncer ?
- **Porte-a-porte** (`t-c1-05`, `n2-23`) : quelles regles de presentation
  physique et de port du badge s'appliquent ?

## 5. Procedures a confirmer

- **Signalement d'une personne vulnerable** (`t-c1-09`, `t-c7-04`, `t-c7-08`,
  `n4-01`, `n4-03`, `n4-18`, `n5-03`). L'application dit « signalez selon la
  procedure interne applicable » sans la decrire : cette procedure existe-t-elle
  et quelle est-elle ?
- **Remontee d'un incident client passe** (`n5-06`) : a qui, sous quel delai ?
- **Remontee d'une demande de geste commercial** (`t-c6-05`) : quel circuit ?
- **Consultation d'un conjoint ou d'un proche** (`t-c6-06`, `n2-13`, `n4-09`,
  `n5-03`) : quelles regles encadrent la souscription au nom d'un foyer ?

## 6. Seuils de reussite provisoires

Definis dans `src/data/config.ts`, **tous provisoires** :

| Seuil | Valeur actuelle | Libelle |
|---|---|---|
| < 50 % | — | Fondamentaux a reprendre |
| >= 50 % | 50 | Acquis fragiles |
| >= 65 % | 65 | Niveau operationnel |
| >= 80 % | 80 | Bonne maitrise |
| >= 90 % | 90 | Maitrise avancee |

Autres parametres a valider :

- `STRENGTH_RATIO = 0.8` : seuil au-dessus duquel une competence est declaree maitrisee.
- `IMPROVE_RATIO = 0.65` : seuil en dessous duquel une competence est signalee a retravailler.
- `UNLOCK_THRESHOLD_PERCENT = 65` : seuil de deblocage en progression conditionnelle.
- `TRAINING_SAMPLE_SIZE = 10` : nombre de questions tirees par serie d'entrainement.
- `PROGRESSION_MODE = 'libre'` : mode par defaut pour la phase pilote.

## 7. Questions necessitant une validation pedagogique

Au-dela des questions marquees, l'equipe formation est invitee a arbitrer sur :

- **Le niveau de severite du niveau 5.** Il a ete calibre sur la nuance et non
  sur la difficulte de formulation. Est-ce le bon curseur ?
- **La regle de notation des choix multiples.** Actuellement : une bonne reponse
  cochee rapporte une part, une mauvaise reponse en retire une part equivalente,
  sans score negatif. Faut-il un bareme different ?
- **La notation partielle des questions de classement.** Actuellement au prorata
  des positions correctes, plutot qu'en tout-ou-rien.
- **Les messages de restitution** par bande de maitrise (`MASTERY_BANDS`) :
  ton, longueur et contenu.
- **Le vocabulaire** : l'ensemble des contenus est ecrit sans accents pour
  garantir un affichage homogene. Si Nice-Matin prefere un texte accentue, la
  reprise est purement editoriale.

## 8. Comment marquer une question comme validee

Dans le fichier de la question :

1. remplacer `source: A_VALIDER` par la reference reelle
   (par exemple `'Guide commercial Nice-Matin 2026, p. 14'`) ;
2. supprimer la ligne `needsNiceMatinReview: true`.

Le test `tests/content.test.ts` verifie qu'une question marquee
`needsNiceMatinReview` porte bien une source signalant qu'elle est a valider :
les deux informations restent donc coherentes.
