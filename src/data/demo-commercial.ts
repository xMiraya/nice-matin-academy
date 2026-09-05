import type { CommercialDashboard, SessionSummary, UserProfile } from "@/src/types";
import { DEMO_SESSION_JULIE } from "@/src/data/demo-session-julie";

/** Profil de démonstration du commercial connecté. */
export const DEMO_COMMERCIAL_PROFILE: UserProfile = {
  id: "u-alexandre-jego",
  slug: "alexandre-jego",
  firstName: "Alexandre",
  lastName: "Jégo",
  role: "Commercial terrain",
  team: "Équipe Nice",
  level: "intermediaire",
  initials: "AJ",
  photo: "/images/equipe/alexandre-jego.jpg",
};

/** Historique fictif servant uniquement à illustrer l'interface. */
export const DEMO_COMMERCIAL_SESSIONS: SessionSummary[] = [
  {
    id: "s-2026-08-04",
    title: "Objection prix : abonnement numérique",
    date: "2026-08-04",
    objectiveLabel: "Gestion de l'objection prix",
    difficulty: "difficile",
    durationSeconds: 612,
    score: 71,
    status: "terminee",
  },
  {
    id: "s-2026-07-31",
    title: "Découverte d'un lecteur occasionnel",
    date: "2026-07-31",
    objectiveLabel: "Découverte des besoins",
    difficulty: "intermediaire",
    durationSeconds: 548,
    score: 66,
    status: "terminee",
  },
  {
    id: "s-2026-07-28",
    title: "Premier contact en porte-à-porte",
    date: "2026-07-28",
    objectiveLabel: "Premier contact",
    difficulty: "facile",
    durationSeconds: 430,
    score: 63,
    status: "terminee",
  },
  {
    id: "s-2026-07-24",
    title: "Conclusion sans pression",
    date: "2026-07-24",
    objectiveLabel: "Conclusion sans pression",
    difficulty: "intermediaire",
    durationSeconds: 501,
    score: 58,
    status: "a-refaire",
  },
  {
    id: "s-2026-07-21",
    title: "Écoute active : lectrice fidèle",
    date: "2026-07-21",
    objectiveLabel: "Écoute active",
    difficulty: "facile",
    durationSeconds: 470,
    score: 61,
    status: "terminee",
  },
  {
    id: "s-2026-07-17",
    title: "Présentation de la valeur : offre week-end",
    date: "2026-07-17",
    objectiveLabel: "Présentation de la valeur",
    difficulty: "intermediaire",
    durationSeconds: 522,
    score: 55,
    status: "terminee",
  },
];

/** Le compte rendu de l'appel test, présenté à part car exclu des statistiques. */
export const DEMO_COMMERCIAL_TECHNICAL_SESSION: SessionSummary = {
  id: DEMO_SESSION_JULIE.id,
  href: "/commercial/simulations/demo-julie",
  title: DEMO_SESSION_JULIE.title,
  date: DEMO_SESSION_JULIE.date,
  objectiveLabel: DEMO_SESSION_JULIE.objectiveLabel,
  difficulty: DEMO_SESSION_JULIE.difficulty,
  durationSeconds: DEMO_SESSION_JULIE.durationSeconds,
  score: DEMO_SESSION_JULIE.globalScore,
  status: DEMO_SESSION_JULIE.status,
  technicalTest: true,
};

export const DEMO_COMMERCIAL_DASHBOARD: CommercialDashboard = {
  profile: DEMO_COMMERCIAL_PROFILE,
  averageScore: 62,
  sessionsCount: DEMO_COMMERCIAL_SESSIONS.length,
  thirtyDayProgress: 9,
  participationStreakWeeks: 4,
  competencyScores: [
    { competencyId: "premier-contact", score: 74, delta: 4 },
    { competencyId: "creation-relation", score: 68, delta: 2 },
    { competencyId: "decouverte-besoins", score: 52, delta: 6 },
    { competencyId: "presentation-offre", score: 65, delta: 1 },
    { competencyId: "gestion-objections", score: 45, delta: -3 },
    { competencyId: "communication", score: 71, delta: 3 },
    { competencyId: "creation-confiance", score: 63, delta: 5 },
    { competencyId: "conclusion", score: 57, delta: 2 },
  ],
  scoreHistory: [
    { label: "17 juil.", score: 55 },
    { label: "21 juil.", score: 61 },
    { label: "24 juil.", score: 58 },
    { label: "28 juil.", score: 63 },
    { label: "31 juil.", score: 66 },
    { label: "4 août", score: 71 },
  ],
  strongest: "premier-contact",
  priority: "gestion-objections",
  nextFocus: {
    title: "Traiter l'objection prix sans céder tout de suite",
    diagnostic:
      "Sur les trois dernières simulations, la première remise arrive en moyenne onze secondes après l'objection, avant toute question de compréhension.",
    action:
      "Prochain entraînement : poser deux questions avant d'évoquer un tarif, puis reformuler l'objection à voix haute.",
    competencyId: "gestion-objections",
  },
  recentSessions: DEMO_COMMERCIAL_SESSIONS.slice(0, 3),
};
