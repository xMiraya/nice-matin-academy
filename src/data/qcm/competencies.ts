import type { Competency, CompetencyId } from '@/src/types/qcm/competency';

/** Mention utilisee partout ou une information Nice-Matin doit etre confirmee. */
export const A_VALIDER = 'A VALIDER AVEC L’EQUIPE FORMATION NICE-MATIN';

/**
 * Source unique de verite des huit competences.
 * Modifier ce fichier suffit a mettre a jour toute l'application.
 */
export const COMPETENCIES: readonly Competency[] = [
  {
    id: 'c1-prise-de-contact',
    order: 1,
    shortLabel: 'Prise de contact',
    label: 'Prise de contact et accueil',
    kicker: 'Competence 1',
    summary:
      "Les premieres secondes decident de la suite de l’echange. Il s’agit de se presenter clairement, d’obtenir l’attention sans l’imposer, et de verifier que le prospect est reellement disponible avant d’aller plus loin.",
    objectives: [
      'Se presenter clairement : identite, entreprise, raison de la prise de contact.',
      "Obtenir l’attention du prospect sans le mettre en difficulte.",
      'Adopter une posture ouverte et adaptee au contexte.',
      'Verifier la disponibilite avant d’engager la decouverte.',
    ],
    expectedBehaviours: [
      'Annoncer son prenom, son nom et le Groupe Nice-Matin des la premiere phrase.',
      'Formuler une demande de disponibilite ouverte plutot qu’une question fermee culpabilisante.',
      'Adapter le debit et le volume de voix a l’environnement du prospect.',
      'Proposer un autre moment si le prospect n’est pas disponible.',
    ],
    commonMistakes: [
      'Enchainer directement sur l’offre sans avoir presente l’objet de l’appel.',
      "Utiliser une accroche artificielle du type « vous avez gagne ».",
      'Ignorer un signal clair d’indisponibilite.',
      'Parler trop vite pour « passer » avant le refus.',
    ],
    source: A_VALIDER,
  },
  {
    id: 'c2-ecoute-active',
    order: 2,
    shortLabel: 'Ecoute active',
    label: 'Ecoute active',
    kicker: 'Competence 2',
    summary:
      "Ecouter n’est pas attendre son tour de parole. L’ecoute active consiste a laisser le prospect s’exprimer, reperer les informations utiles et rebondir dessus plutot que derouler un argumentaire prepare.",
    objectives: [
      'Laisser le prospect terminer ses phrases.',
      'Reperer les informations exploitables dans son discours.',
      'Poser des questions qui prolongent ce qui vient d’etre dit.',
      'Eviter la recitation mecanique d’un argumentaire.',
    ],
    expectedBehaviours: [
      'Marquer un temps de silence apres une reponse du prospect.',
      'Reprendre les mots exacts du prospect dans la question suivante.',
      'Noter les elements factuels cites spontanement.',
      'Accepter une digression courte avant de recentrer avec tact.',
    ],
    commonMistakes: [
      'Couper la parole des qu’une objection se profile.',
      'Poser une question dont la reponse vient d’etre donnee.',
      'Enchainer les questions sans exploiter les reponses.',
      'Repondre a cote parce que l’argumentaire suivant etait deja prepare.',
    ],
    source: A_VALIDER,
  },
  {
    id: 'c3-decouverte-des-besoins',
    order: 3,
    shortLabel: 'Decouverte',
    label: 'Decouverte des besoins',
    kicker: 'Competence 3',
    summary:
      "La decouverte permet de comprendre comment le prospect s’informe aujourd’hui : supports utilises, frequence, centres d’interet, composition du foyer, attentes et freins. Sans decouverte, l’argumentation ne peut etre que generique.",
    objectives: [
      'Identifier les habitudes d’information du prospect.',
      'Reperer les supports deja utilises et leur frequence.',
      'Comprendre les centres d’interet et les besoins du foyer.',
      'Faire emerger les freins avant qu’ils ne deviennent des objections.',
    ],
    expectedBehaviours: [
      'Alterner questions ouvertes pour explorer et questions fermees pour preciser.',
      'Interroger la frequence reelle de lecture, pas seulement l’interet declare.',
      'Demander qui d’autre dans le foyer est concerne.',
      'Formuler explicitement une question sur les freins eventuels.',
    ],
    commonMistakes: [
      'Passer a l’offre apres une seule question.',
      'Supposer les besoins a partir de l’age ou du quartier.',
      'Enchainer des questions fermees qui ressemblent a un formulaire.',
      'Oublier de demander comment le prospect s’informe deja.',
    ],
    source: A_VALIDER,
  },
  {
    id: 'c4-reformulation',
    order: 4,
    shortLabel: 'Reformulation',
    label: 'Reformulation et comprehension',
    kicker: 'Competence 4',
    summary:
      "Reformuler consiste a restituer fidelement ce que le prospect a dit, puis a faire valider ce resume. C’est le moment ou l’on distingue un besoin d’une objection et ou l’on montre que l’on a reellement ecoute.",
    objectives: [
      'Restituer fidelement le contenu, sans l’embellir.',
      'Faire valider la reformulation par le prospect.',
      'Distinguer un besoin exprime d’une objection.',
      'Resumer la situation avant de passer a l’offre.',
    ],
    expectedBehaviours: [
      'Utiliser une formule de verification : « si je comprends bien… c’est bien cela ? »',
      'Reprendre les priorites dans l’ordre donne par le prospect.',
      'Corriger immediatement sa reformulation si le prospect la nuance.',
      'Reformuler aussi les reserves, pas uniquement les points positifs.',
    ],
    commonMistakes: [
      'Reformuler en ajoutant un besoin que le prospect n’a pas exprime.',
      "Transformer la reformulation en argumentaire deguise.",
      'Ne pas attendre la validation avant d’enchainer.',
      'Ne reformuler que ce qui arrange la vente.',
    ],
    source: A_VALIDER,
  },
  {
    id: 'c5-argumentation',
    order: 5,
    shortLabel: 'Argumentation',
    label: 'Argumentation et presentation de l’offre',
    kicker: 'Competence 5',
    summary:
      "Argumenter, c’est relier chaque element de l’offre a un besoin reellement exprime. Les informations commerciales (contenu, tarifs, engagements) doivent etre strictement conformes aux informations officielles Nice-Matin.",
    objectives: [
      'Selectionner l’offre reellement pertinente pour le prospect.',
      'Relier chaque benefice a un besoin exprime pendant la decouverte.',
      'Expliquer clairement le contenu de l’offre.',
      'Ne jamais inventer un tarif, une promotion ou une fonctionnalite.',
    ],
    expectedBehaviours: [
      'Citer au maximum deux ou trois benefices, choisis en fonction de la decouverte.',
      'Utiliser la structure : element de l’offre, puis benefice concret pour le prospect.',
      'Annoncer clairement ce qui est inclus et ce qui ne l’est pas.',
      "Dire « je verifie et je vous rappelle » plutot que d’improviser une reponse.",
    ],
    commonMistakes: [
      'Derouler la totalite du catalogue.',
      'Employer des arguments generiques valables pour n’importe quel prospect.',
      'Arrondir ou approximer un tarif.',
      'Annoncer une promotion non confirmee.',
    ],
    source: A_VALIDER,
  },
  {
    id: 'c6-objections',
    order: 6,
    shortLabel: 'Objections',
    label: 'Traitement des objections',
    kicker: 'Competence 6',
    summary:
      "Une objection est une information, pas un echec. La demarche attendue est constante : accueillir, comprendre precisement, repondre avec une information exacte, puis verifier que la reponse convient.",
    objectives: [
      'Accueillir l’objection sans se justifier ni se braquer.',
      'Comprendre ce qu’elle recouvre reellement avant de repondre.',
      'Repondre avec des informations exactes et verifiables.',
      'Verifier que la reponse a leve la reserve.',
    ],
    expectedBehaviours: [
      'Poser une question de clarification avant toute reponse.',
      'Traiter separement le prix percu et le budget reel.',
      'Accepter qu’un prospect souhaite consulter un proche.',
      'Respecter un refus de communiquer des coordonnees.',
    ],
    commonMistakes: [
      'Repondre a une objection prix par une remise inventee.',
      "Enchainer les arguments pour « couvrir » l’objection.",
      'Denigrer l’information gratuite en ligne ou les autres medias.',
      'Insister apres un refus clair et repete.',
    ],
    source: A_VALIDER,
  },
  {
    id: 'c7-posture',
    order: 7,
    shortLabel: 'Posture',
    label: 'Confiance, empathie et posture',
    kicker: 'Competence 7',
    summary:
      "La posture conditionne la confiance : rester calme, adapter son rythme, employer un langage comprehensible, respecter la personne. Elle inclut la vigilance envers les personnes vulnerables et la capacite a arreter une vente qui ne doit pas se faire.",
    objectives: [
      'Rester calme et respectueux en toute circonstance.',
      'Adapter son rythme et son vocabulaire a l’interlocuteur.',
      'Creer un climat de confiance sans surjouer la proximite.',
      'Identifier les situations ou la vente doit etre interrompue.',
    ],
    expectedBehaviours: [
      'Ralentir et simplifier son vocabulaire si le prospect semble perdu.',
      'Reformuler sans jargon les termes techniques ou contractuels.',
      "Interrompre l’echange si la personne semble desorientee ou vulnerable.",
      'Proposer qu’un proche soit associe a la decision lorsque c’est pertinent.',
    ],
    commonMistakes: [
      'Culpabiliser le prospect pour obtenir un accord.',
      'Denigrer un autre media ou un concurrent.',
      'Poursuivre une vente aupres d’une personne manifestement vulnerable.',
      'Utiliser un vocabulaire technique non explique.',
    ],
    source: A_VALIDER,
  },
  {
    id: 'c8-conclusion',
    order: 8,
    shortLabel: 'Conclusion',
    label: 'Conclusion et prise de conge',
    kicker: 'Competence 8',
    summary:
      "Conclure consiste a reconnaitre le bon moment, resumer l’engagement, verifier explicitement l’accord et proposer une etape suivante claire. Un refus se conclut avec le meme professionnalisme qu’un accord.",
    objectives: [
      'Reperer les signaux indiquant que le prospect est pret.',
      'Resumer precisement ce qui est engage.',
      'Obtenir un accord explicite, jamais implicite.',
      'Accepter un refus et quitter l’echange proprement.',
    ],
    expectedBehaviours: [
      'Recapituler l’offre, la duree et les conditions avant de demander l’accord.',
      'Poser une question de validation directe et fermee.',
      'Annoncer la prochaine etape concrete et sa date.',
      'Remercier et laisser un moyen de recontact apres un refus.',
    ],
    commonMistakes: [
      'Conclure avant d’avoir traite une reserve encore ouverte.',
      'Interpreter un silence comme un accord.',
      'Ajouter un argument supplementaire apres l’accord obtenu.',
      'Terminer sechement un echange qui se solde par un refus.',
    ],
    source: A_VALIDER,
  },
];

const BY_ID = new Map<CompetencyId, Competency>(COMPETENCIES.map((c) => [c.id, c]));

export function getCompetency(id: CompetencyId): Competency {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Competence inconnue : ${id}`);
  return found;
}

export function findCompetency(id: string): Competency | undefined {
  return BY_ID.get(id as CompetencyId);
}

export const COMPETENCY_IDS: readonly CompetencyId[] = COMPETENCIES.map((c) => c.id);
