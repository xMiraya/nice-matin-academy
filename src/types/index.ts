/**
 * Modèle de données de la plateforme Nice-Matin Academy.
 *
 * Ces interfaces décrivent la forme attendue des données. En phase 1 elles sont
 * alimentées par les fichiers de `src/data`. Elles sont volontairement neutres
 * pour pouvoir être remplacées plus tard par des tables Supabase et par la
 * sortie du Coach IA sans modifier les composants d'affichage.
 */

/** Identifiants stables des huit compétences évaluées par le Coach IA. */
export type CompetencyId =
  | "premier-contact"
  | "creation-relation"
  | "decouverte-besoins"
  | "presentation-offre"
  | "gestion-objections"
  | "communication"
  | "creation-confiance"
  | "conclusion";

export interface Competency {
  id: CompetencyId;
  label: string;
  /** Libellé court, utilisé sur les axes des graphiques. */
  short: string;
  /** Description courte utilisée dans les cartes de recommandation. */
  description: string;
}

/** Score sur 100 pour une compétence donnée. */
export interface CompetencyScore {
  competencyId: CompetencyId;
  score: number;
  /** Écart en points par rapport à la simulation précédente, si connu. */
  delta?: number;
}

export type SessionStatus = "terminee" | "en-analyse" | "a-refaire";

export type SessionDifficulty = "facile" | "intermediaire" | "difficile";

export interface SessionObjective {
  id: string;
  label: string;
  description: string;
  /**
   * Compétence que cet objectif entraîne en priorité. Sert à indiquer au
   * Coach IA quelles compétences mettre en avant dans le futur compte rendu ;
   * les compétences non sélectionnées restent observées mais non prioritaires.
   */
  competencyId: CompetencyId;
}

/**
 * Sélection d'objectifs pédagogiques faite par le commercial avant une
 * simulation. Prête à être transmise au Coach IA et enregistrée dans
 * Supabase : un tableau vide n'est jamais envoyé, une simulation ne peut être
 * lancée qu'avec au moins un objectif sélectionné.
 */
export interface SimulationObjectiveSelection {
  selectedObjectiveIds: string[];
  /** Vrai lorsque tous les objectifs proposés sont sélectionnés. */
  isFullInterview: boolean;
}

/** Jauges psychologiques internes du personnage virtuel (0 à 100). */
export interface PsychologicalState {
  confiance: number;
  interet: number;
  comprehension: number;
  valeurPercue: number;
  pressionRessentie: number;
}

export type KeyMomentTone = "positif" | "vigilance" | "critique" | "neutre";

export interface KeyMoment {
  /** Horodatage relatif au début de l'appel, format mm:ss. */
  timestamp: string;
  title: string;
  detail: string;
  tone: KeyMomentTone;
}

export interface TranscriptLine {
  speaker: "commercial" | "julie";
  /** Horodatage relatif, optionnel. */
  timestamp?: string;
  text: string;
}

export interface CoachPriority {
  title: string;
  diagnostic: string;
  action: string;
  competencyId: CompetencyId;
}

/** Compte rendu complet produit par le Coach IA après une simulation. */
export interface SessionReport {
  id: string;
  title: string;
  /** Date ISO (AAAA-MM-JJ). */
  date: string;
  characterName: string;
  difficulty: SessionDifficulty;
  objectiveLabel: string;
  status: SessionStatus;
  /** Durée en secondes. */
  durationSeconds: number;
  globalScore: number;
  competencyScores: CompetencyScore[];
  outcome: string;
  outcomeReason?: string;
  /** Marque un appel de validation technique, exclu des statistiques. */
  technicalTest: boolean;
  recordingAvailable: boolean;
  recordingNotice?: string;
  transcriptAvailable: boolean;
  perceptionNotice?: string;
  psychologicalStart: PsychologicalState;
  psychologicalEnd: PsychologicalState;
  keyMoments: KeyMoment[];
  observations: string[];
  priorities: CoachPriority[];
  transcript: TranscriptLine[];
  /** Synthèse rédigée pour la vue manager. */
  managerSummary?: string;
}

/** Ligne compacte d'historique (liste, tableau). */
export interface SessionSummary {
  id: string;
  /** Route interne du compte rendu, si disponible. */
  href?: string;
  title: string;
  date: string;
  objectiveLabel: string;
  difficulty: SessionDifficulty;
  durationSeconds: number;
  score: number | null;
  status: SessionStatus;
  technicalTest?: boolean;
  repName?: string;
}

export type ExperienceLevel = "debutant" | "intermediaire" | "confirme";

export interface UserProfile {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  role: string;
  team: string;
  level?: ExperienceLevel;
  /** Initiales affichées à la place d'une photographie. */
  initials: string;
}

export interface CommercialDashboard {
  profile: UserProfile;
  averageScore: number;
  sessionsCount: number;
  /** Progression en points sur les trente derniers jours. */
  thirtyDayProgress: number;
  participationStreakWeeks: number;
  competencyScores: CompetencyScore[];
  scoreHistory: { label: string; score: number }[];
  strongest: CompetencyId;
  priority: CompetencyId;
  nextFocus: CoachPriority;
  recentSessions: SessionSummary[];
}

export interface TeamMember {
  profile: UserProfile;
  averageScore: number;
  sessionsCount: number;
  /** Progression en points sur trente jours. */
  progress: number;
  lastSessionDate: string | null;
  competencyScores: CompetencyScore[];
  /** Route de la fiche détaillée, si elle existe dans la maquette. */
  href?: string;
}

export type AlertLevel = "information" | "vigilance" | "priorite";

export interface PedagogicalAlert {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
  repName?: string;
}

export interface ManagerDashboard {
  profile: UserProfile;
  organisation: string;
  repsCount: number;
  sessionsCount: number;
  participationRate: number;
  teamAverageScore: number;
  averageProgress: number;
  competenciesToStrengthen: number;
  weeklyEvolution: { week: string; score: number; sessions: number }[];
  scoreDistribution: { range: string; count: number }[];
  members: TeamMember[];
  alerts: PedagogicalAlert[];
  recentSessions: SessionSummary[];
}
