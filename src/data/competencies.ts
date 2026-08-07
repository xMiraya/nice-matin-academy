import type { Competency, CompetencyId, SessionObjective } from "@/src/types";

/** Référentiel des huit compétences évaluées par le Coach IA. */
export const COMPETENCIES: Competency[] = [
  {
    id: "premier-contact",
    label: "Premier contact",
    short: "Contact",
    description: "Ouvrir l'échange avec clarté et donner envie de poursuivre.",
  },
  {
    id: "creation-relation",
    label: "Création de la relation",
    short: "Relation",
    description: "Installer un climat cordial et personnalisé dès les premières minutes.",
  },
  {
    id: "decouverte-besoins",
    label: "Découverte des besoins",
    short: "Découverte",
    description: "Poser des questions ouvertes et reformuler ce que le client exprime.",
  },
  {
    id: "presentation-offre",
    label: "Présentation de l'offre",
    short: "Offre",
    description: "Exposer l'abonnement de façon structurée, concrète et adaptée.",
  },
  {
    id: "gestion-objections",
    label: "Gestion des objections",
    short: "Objections",
    description: "Accueillir l'objection, la comprendre, puis y répondre avec des faits.",
  },
  {
    id: "communication",
    label: "Communication",
    short: "Communication",
    description: "Maîtriser le rythme, le vocabulaire et le registre de langue.",
  },
  {
    id: "creation-confiance",
    label: "Création de confiance",
    short: "Confiance",
    description: "Être transparent sur le prix, les engagements et les conditions.",
  },
  {
    id: "conclusion",
    label: "Conclusion",
    short: "Conclusion",
    description: "Proposer une suite claire sans forcer la décision.",
  },
];

const COMPETENCY_MAP = new Map<CompetencyId, Competency>(
  COMPETENCIES.map((competency) => [competency.id, competency]),
);

export function getCompetency(id: CompetencyId): Competency {
  const competency = COMPETENCY_MAP.get(id);
  if (!competency) {
    throw new Error(`Compétence inconnue : ${id}`);
  }
  return competency;
}

export function getCompetencyLabel(id: CompetencyId): string {
  return getCompetency(id).label;
}

/** Objectifs pédagogiques proposés à la préparation d'une simulation. */
export const OBJECTIVES: SessionObjective[] = [
  {
    id: "premier-contact",
    label: "Premier contact",
    description: "Se présenter, annoncer le motif de l'appel et obtenir l'accord de poursuivre.",
    competencyId: "premier-contact",
  },
  {
    id: "decouverte-besoins",
    label: "Découverte des besoins",
    description: "Identifier les habitudes de lecture et les attentes réelles du client.",
    competencyId: "decouverte-besoins",
  },
  {
    id: "ecoute-active",
    label: "Écoute active",
    description: "Reformuler, laisser le silence travailler, ne pas couper la parole.",
    competencyId: "communication",
  },
  {
    id: "objection-prix",
    label: "Gestion de l'objection prix",
    description: "Traiter le « c'est trop cher » sans céder immédiatement sur la remise.",
    competencyId: "gestion-objections",
  },
  {
    id: "presentation-valeur",
    label: "Présentation de la valeur",
    description: "Relier chaque élément de l'abonnement à un bénéfice concret.",
    competencyId: "presentation-offre",
  },
  {
    id: "conclusion-sans-pression",
    label: "Conclusion sans pression",
    description: "Proposer une décision claire en laissant le client libre de refuser.",
    competencyId: "conclusion",
  },
];

/**
 * Option mise en avant qui coche automatiquement les six objectifs.
 * Une simulation complète évalue les huit compétences commerciales, y
 * compris celles qu'aucun objectif individuel ne cible directement.
 */
export const FULL_INTERVIEW_OPTION = {
  label: "Entretien commercial complet",
  description: "Évaluer toutes les étapes de l'entretien, du premier contact jusqu'à la conclusion.",
} as const;

export const PSYCH_GAUGE_LABELS: Record<
  "confiance" | "interet" | "comprehension" | "valeurPercue" | "pressionRessentie",
  string
> = {
  confiance: "Confiance",
  interet: "Intérêt",
  comprehension: "Compréhension",
  valeurPercue: "Valeur perçue",
  pressionRessentie: "Pression ressentie",
};
