import type { SessionReport } from "@/src/types";

/**
 * Compte rendu de l'appel de validation technique réalisé avec Julie Dupont.
 *
 * Cet échange a servi à vérifier la voix française du personnage. Le commercial
 * a volontairement adopté une attitude inadaptée : les scores ci-dessous ne
 * constituent donc pas une évaluation commerciale et sont exclus des
 * statistiques d'équipe.
 */
export const DEMO_SESSION_JULIE: SessionReport = {
  id: "demo-julie",
  title: "Validation voix Julie Français",
  date: "2026-08-06",
  characterName: "Julie Dupont",
  difficulty: "intermediaire",
  objectiveLabel: "Premier contact",
  status: "terminee",
  durationSeconds: 129,
  globalScore: 4,
  technicalTest: true,
  outcome: "Julie met fin à l'échange",
  outcomeReason: "Attitude et communication inadaptées",
  recordingAvailable: false,
  recordingNotice: "Aucun enregistrement disponible pour ce test",
  transcriptAvailable: true,
  perceptionNotice:
    "Analyse de perception disponible, mais la caméra du commercial est restée majoritairement noire : les indicateurs visuels sont peu fiables.",
  competencyScores: [
    { competencyId: "premier-contact", score: 5 },
    { competencyId: "creation-relation", score: 0 },
    { competencyId: "decouverte-besoins", score: 0 },
    { competencyId: "presentation-offre", score: 8 },
    { competencyId: "gestion-objections", score: 5 },
    { competencyId: "communication", score: 0 },
    { competencyId: "creation-confiance", score: 0 },
    { competencyId: "conclusion", score: 10 },
  ],
  psychologicalStart: {
    confiance: 35,
    interet: 30,
    comprehension: 10,
    valeurPercue: 15,
    pressionRessentie: 10,
  },
  psychologicalEnd: {
    confiance: 0,
    interet: 5,
    comprehension: 10,
    valeurPercue: 5,
    pressionRessentie: 95,
  },
  keyMoments: [
    {
      timestamp: "01:13",
      title: "Approche agressive",
      detail: "« donne-moi ton fric » : l'ouverture supprime toute possibilité de relation.",
      tone: "critique",
    },
    {
      timestamp: "01:32",
      title: "Prix incohérent annoncé",
      detail: "Un tarif de 150 € par jour est annoncé, sans rapport avec l'offre réelle.",
      tone: "critique",
    },
    {
      timestamp: "01:38",
      title: "Julie tente de terminer l'échange",
      detail: "Premier signal de retrait explicite du client.",
      tone: "vigilance",
    },
    {
      timestamp: "01:47",
      title: "Insistance après le refus",
      detail: "Nouvelle proposition tarifaire immédiate au lieu d'accueillir le refus.",
      tone: "vigilance",
    },
    {
      timestamp: "02:02",
      title: "Propos irrespectueux",
      detail: "Registre familier et agressif envers le client.",
      tone: "critique",
    },
    {
      timestamp: "02:09",
      title: "Refus définitif de Julie",
      detail: "Julie clôt l'échange en citant la manière de lui parler, pas le prix.",
      tone: "critique",
    },
  ],
  observations: [
    "Aucune phase de découverte : le besoin du client n'est jamais interrogé.",
    "Deux prix contradictoires annoncés en trente secondes, ce qui détruit la crédibilité.",
    "Le refus du client déclenche une insistance au lieu d'une reformulation.",
    "Le registre de langue devient familier puis irrespectueux.",
    "Point positif isolé : l'objet de l'appel est annoncé dès la première phrase.",
  ],
  priorities: [
    {
      title: "Reprendre l'ouverture d'appel",
      diagnostic: "L'intention commerciale est annoncée sans salutation ni cadrage.",
      action:
        "Travailler une ouverture en trois temps : se présenter, annoncer le motif, demander l'accord de poursuivre.",
      competencyId: "premier-contact",
    },
    {
      title: "Fiabiliser le discours tarifaire",
      diagnostic: "Deux tarifs incompatibles sont annoncés, sans contenu associé.",
      action:
        "Mémoriser la grille réelle et présenter systématiquement le prix accompagné de ce qu'il contient.",
      competencyId: "creation-confiance",
    },
    {
      title: "Accueillir le refus",
      diagnostic: "Le premier refus déclenche une relance immédiate, puis une réaction agressive.",
      action:
        "S'entraîner à reformuler le refus et à proposer une suite libre : « je comprends, souhaitez-vous que je vous envoie le détail ? »",
      competencyId: "gestion-objections",
    },
  ],
  transcript: [
    {
      speaker: "commercial",
      timestamp: "01:11",
      text: "Euh oui, c'est ça, je suis venu pour Nice-Matin, je suis venu vous vendre un abonnement, donne-moi ton fric.",
    },
    {
      speaker: "julie",
      timestamp: "01:21",
      text: "Euh… si c'est pour me proposer un abonnement, expliquez-moi plutôt calmement ce qu'il comprend et à quel prix.",
    },
    {
      speaker: "commercial",
      timestamp: "01:32",
      text: "Alors, ça coûte la peau du cul, on est pour cent cinquante euros par jour.",
    },
    {
      speaker: "julie",
      timestamp: "01:38",
      text: "Cent cinquante euros par jour ? Non, là ce n'est pas sérieux. Je préfère qu'on en reste là, merci.",
    },
    {
      speaker: "commercial",
      timestamp: "01:47",
      text: "Non, non, attends, je te propose un euro le mois.",
    },
    {
      speaker: "julie",
      timestamp: "01:53",
      text: "Un euro par mois, c'est très différent. Mais j'aimerais comprendre ce que j'ai exactement pour ce prix.",
    },
    {
      speaker: "commercial",
      timestamp: "02:02",
      text: "Mais tu ne vas pas me faire chier pour un euro par mois, ça va !",
    },
    {
      speaker: "julie",
      timestamp: "02:09",
      text: "Dans ce cas, non merci. Ce n'est pas le prix qui me dérange, c'est votre manière de me parler. Bonne journée.",
    },
  ],
  managerSummary:
    "Appel de validation technique de la voix française de Julie. Le commercial a volontairement adopté une posture agressive afin de vérifier la capacité du personnage à interrompre un échange. Le scénario a fonctionné : Julie a détecté le registre inadapté et a clos la conversation en citant la manière de lui parler, et non le prix. Aucune conclusion pédagogique ne doit être tirée sur Alexandre Jégo à partir de cet appel : il est exclu des statistiques d'équipe.",
};

/** Extrait de la conversation utilisé dans les listes d'historique. */
export const DEMO_SESSION_JULIE_SUMMARY = {
  id: DEMO_SESSION_JULIE.id,
  title: DEMO_SESSION_JULIE.title,
  date: DEMO_SESSION_JULIE.date,
  objectiveLabel: DEMO_SESSION_JULIE.objectiveLabel,
  difficulty: DEMO_SESSION_JULIE.difficulty,
  durationSeconds: DEMO_SESSION_JULIE.durationSeconds,
  score: DEMO_SESSION_JULIE.globalScore,
  status: DEMO_SESSION_JULIE.status,
  technicalTest: true,
} as const;
