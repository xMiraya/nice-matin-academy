# Référentiel du QCM : deux taxonomies à aligner

**État au 27 août 2026 — décision à prendre par l'équipe formation.**

## Le constat

Trois briques de l'académie parlent de « huit compétences », mais pas des mêmes.

| Coach IA + fiches méthodologiques | Entraînement QCM |
|---|---|
| `premier-contact` — Premier contact | `c1-prise-de-contact` — Prise de contact et accueil |
| `creation-relation` — Création de la relation | `c2-ecoute-active` — Écoute active |
| `decouverte-besoins` — Découverte des besoins | `c3-decouverte-des-besoins` — Découverte des besoins |
| `presentation-offre` — Présentation de l'offre | `c4-reformulation` — Reformulation |
| `gestion-objections` — Gestion des objections | `c5-argumentation` — Argumentation |
| `communication` — Communication | `c6-objections` — Traitement des objections |
| `creation-confiance` — Création de confiance | `c7-posture` — Posture et communication |
| `conclusion` — Conclusion | `c8-conclusion` — Conclusion |

Cinq compétences se correspondent raisonnablement (contact, découverte, offre /
argumentation, objections, conclusion). Trois ne se recouvrent pas :

- `c2-ecoute-active` et `c4-reformulation` sont, côté Coach IA, deux facettes de
  `decouverte-besoins` ;
- `c7-posture` recouvre à la fois `communication` et une partie de
  `creation-relation` ;
- `creation-confiance` (transparence sur le prix et les engagements) n'a pas
  d'équivalent dans le QCM.

## Ce qui a été fait

Le QCM a été intégré **avec sa taxonomie d'origine**, intacte. C'était le choix
le moins destructeur : les 260 questions, leurs corrections, le calcul du score
par compétence et les recommandations sont tous écrits contre ces huit
identifiants. Les réaligner de force aurait mal étiqueté des questions sans que
personne ne l'ait validé.

Conséquence visible aujourd'hui : le graphique « résultat par compétence » du QCM
et celui du Coach IA ne se comparent pas directement.

## Les options

1. **Réécrire le référentiel du QCM sur celui du Coach IA.** Le plus propre à
   terme. Demande de reclasser les 260 questions une à une et de réécrire les
   quinze questions de `creation-confiance`, absentes aujourd'hui. Charge réelle,
   à faire relire par l'équipe formation.
2. **Table de correspondance.** On garde les deux taxonomies et on projette les
   scores QCM sur les huit compétences du Coach IA au moment de l'affichage.
   Rapide, mais les trois compétences non recouvrantes restent approximatives.
3. **Assumer deux référentiels.** Le QCM mesure la connaissance de la méthode,
   le Coach IA mesure la pratique. Ne rien changer, et l'expliquer dans
   l'interface.

Aucune de ces options n'a été mise en œuvre : elle relève d'un arbitrage
pédagogique, pas technique.
