/**
 * Types du Coach IA Nice-Matin.
 *
 * Le `CoachReport` est le contrat stable entre la route d'analyse, la couche de
 * stockage et les écrans. Aucune clé, aucun prompt système et aucun transcript
 * intégral n'entre dans ces structures : elles sont destinées à circuler
 * jusqu'au navigateur.
 */

import type { CompetencyId } from "@/src/types";

/** Issue technique de la simulation, telle qu'interprétée par le Coach. */
export type CoachOutcome = "accepted" | "refused" | "postponed" | "interrupted" | "inconclusive";

export type CoachConfidenceLevel = "high" | "medium" | "low";

export type CoachKeyMomentType =
  | "positive"
  | "warning"
  | "objection"
  | "turning_point"
  | "conclusion";

/** Preuve courte extraite du transcript, rattachée à une compétence. */
export interface CoachEvidence {
  timestampSeconds: number;
  speaker: "commercial" | "julie";
  excerpt: string;
}

export interface CoachCompetencyScore {
  id: CompetencyId;
  label: string;
  /** Note proposée par le Coach, entier de 0 à 10. */
  score: number;
  /** Poids dans le barème, total 100 sur les huit compétences. */
  weight: number;
  observation: string;
  evidence: CoachEvidence[];
}

/** Estimation pédagogique de l'état interne de Julie en fin d'échange (0 à 100). */
export interface CoachPsychologicalState {
  confidence: number;
  interest: number;
  understanding: number;
  perceivedValue: number;
  feltPressure: number;
}

export interface CoachHighlight {
  title: string;
  explanation: string;
  timestampSeconds: number | null;
}

export interface CoachNextAction {
  title: string;
  instruction: string;
}

export interface CoachKeyMoment {
  timestampSeconds: number;
  type: CoachKeyMomentType;
  title: string;
  explanation: string;
}

export interface CoachMissedOpportunity {
  timestampSeconds: number | null;
  title: string;
  explanation: string;
}

export interface CoachPedagogicalPriority {
  competencyId: CompetencyId;
  label: string;
  reason: string;
}

export interface CoachSessionInfo {
  /** Date ISO du début de la conversation. */
  date: string;
  durationSeconds: number;
  selectedObjectiveIds: string[];
  selectedObjectiveLabels: string[];
  outcome: CoachOutcome;
  outcomeLabel: string;
}

export interface CoachParticipant {
  id: string;
  name: string;
}

/** Compte rendu complet produit par le Coach IA pour une simulation. */
export interface CoachReport {
  reportId: string;
  conversationId: string;
  generatedAt: string;
  model: string;
  commercial: CoachParticipant;
  prospect: CoachParticipant;
  session: CoachSessionInfo;
  /** Recalculé côté serveur à partir des huit notes : jamais accepté tel quel. */
  overallScore: number;
  scoreInterpretation: string;
  competencies: CoachCompetencyScore[];
  psychologicalState: CoachPsychologicalState;
  strengths: CoachHighlight[];
  improvements: CoachHighlight[];
  nextActions: CoachNextAction[];
  keyMoments: CoachKeyMoment[];
  missedOpportunities: CoachMissedOpportunity[];
  commercialSummary: string;
  managerSummary: string;
  pedagogicalPriority: CoachPedagogicalPriority;
  confidenceLevel: CoachConfidenceLevel;
  limitations: string[];
  transcriptAvailable: boolean;
  perceptionAvailable: boolean;
}

/* ------------------------------------------------------------------ */
/* Données Tavus (côté serveur uniquement)                             */
/* ------------------------------------------------------------------ */

/**
 * Entrée de transcript conservée après filtrage.
 * Les rôles `system` et `tool` sont supprimés en amont : le prompt maître de
 * Julie ne doit jamais atteindre le Coach.
 */
export interface TavusTranscriptEntry {
  role: "user" | "assistant";
  content: string;
  secondsFromStart: number;
  durationSeconds: number | null;
}

/** Analyse de perception Tavus, après retrait des descripteurs sensibles. */
export interface TavusPerceptionAnalysis {
  /** Texte conservé, expurgé des observations physiques et démographiques. */
  summary: string;
  /** Vrai si au moins un passage a été retiré pour raison de confidentialité. */
  redacted: boolean;
}

/* ------------------------------------------------------------------ */
/* Contrats de l'API d'analyse                                         */
/* ------------------------------------------------------------------ */

export interface CoachAnalysisRequest {
  conversationId: string;
  selectedObjectiveIds: string[];
  selectedObjectiveLabels: string[];
  commercial: CoachParticipant;
}

export interface CoachAnalysisResponse {
  status: "ready";
  report: CoachReport;
}

/** Réponse 202 : la conversation ou le transcript n'est pas encore disponible. */
export interface CoachPendingResponse {
  status: "waiting_for_call_end" | "waiting_for_transcript";
  message: string;
  retryAfterSeconds: number;
}

export interface CoachApiError {
  error: string;
  code?: string;
}
