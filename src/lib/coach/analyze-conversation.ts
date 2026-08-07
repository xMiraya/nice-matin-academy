import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { CompetencyId } from "@/src/types";
import type {
  CoachCompetencyScore,
  CoachEvidence,
  CoachHighlight,
  CoachKeyMoment,
  CoachMissedOpportunity,
  CoachNextAction,
  CoachReport,
  TavusPerceptionAnalysis,
  TavusTranscriptEntry,
} from "@/src/types/coach";
import {
  COACH_COMPETENCY_SCALE,
  clampInteger,
  computeOverallScore,
  defaultScoreInterpretation,
} from "@/src/lib/coach/competency-scale";
import { COACH_SYSTEM_PROMPT, buildCoachUserPayload } from "@/src/lib/coach/prompt";
import { CoachModelOutputSchema, type CoachModelOutput } from "@/src/lib/coach/schema";

/**
 * Appel du Coach GPT via l'API Responses, en sortie structurée stricte.
 *
 * TODO sécurité : ajouter authentification, autorisation, limitation de débit et
 * stockage interne avant production.
 *
 * `OPENAI_API_KEY` reste exclusivement côté serveur et n'est jamais journalisée.
 */

const DEFAULT_MODEL = "gpt-5.6-terra";
const OPENAI_TIMEOUT_MS = 180_000;

/** Limites de longueur imposées côté serveur, conformément au contrat de données. */
const MAX_SHORT_TEXT = 180;
const MAX_COMMERCIAL_SUMMARY = 500;
const MAX_MANAGER_SUMMARY = 650;

export type CoachAnalysisOutcome =
  | { kind: "ok"; output: CoachModelOutput; model: string }
  | { kind: "not_configured" }
  | { kind: "rate_limited" }
  | { kind: "invalid_output" }
  | { kind: "upstream_error" };

export interface AnalyzeConversationInput {
  transcript: TavusTranscriptEntry[];
  perception: TavusPerceptionAnalysis | null;
  durationSeconds: number;
  shutdownReason: string | null;
  selectedObjectiveLabels: string[];
  commercialName: string;
}

/**
 * Garde-fou de dernier recours : vérifie par le code qu'aucune entrée de rôle
 * `system` ou `tool` ne peut atteindre le modèle. Le filtrage a déjà lieu à la
 * source, cette assertion protège contre une régression future.
 */
export function assertNoSystemEntries(transcript: TavusTranscriptEntry[]): void {
  const forbidden = transcript.filter(
    (entry) => entry.role !== "user" && entry.role !== "assistant",
  );
  if (forbidden.length > 0) {
    throw new Error(
      "Transcript invalide : des entrées non conversationnelles ont été détectées avant l'envoi au Coach.",
    );
  }
}

export async function analyzeConversation(
  input: AnalyzeConversationInput,
): Promise<CoachAnalysisOutcome> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { kind: "not_configured" };

  const model = process.env.OPENAI_COACH_MODEL || DEFAULT_MODEL;

  // Barrière de sécurité avant tout appel réseau.
  assertNoSystemEntries(input.transcript);

  const client = new OpenAI({
    apiKey,
    timeout: OPENAI_TIMEOUT_MS,
    // Une seule tentative applicative ; le SDK ne réessaie que sur erreur réseau
    // ou statut temporaire.
    maxRetries: 1,
  });

  try {
    const response = await client.responses.parse({
      model,
      input: [
        { role: "system", content: COACH_SYSTEM_PROMPT },
        { role: "user", content: buildCoachUserPayload(input) },
      ],
      reasoning: { effort: "medium" },
      // Aucun outil : ni recherche Internet, ni exécution de code.
      tools: [],
      // Aucune conservation d'état conversationnel côté fournisseur.
      store: false,
      text: { format: zodTextFormat(CoachModelOutputSchema, "coach_report") },
    });

    const parsed = response.output_parsed;
    if (!parsed) return { kind: "invalid_output" };

    const validated = CoachModelOutputSchema.safeParse(parsed);
    if (!validated.success) return { kind: "invalid_output" };

    return { kind: "ok", output: validated.data, model };
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) return { kind: "not_configured" };
    if (status === 429) return { kind: "rate_limited" };
    return { kind: "upstream_error" };
  }
}

export interface BuildReportInput {
  reportId: string;
  conversationId: string;
  model: string;
  output: CoachModelOutput;
  commercial: { id: string; name: string };
  sessionDate: string;
  durationSeconds: number;
  selectedObjectiveIds: string[];
  selectedObjectiveLabels: string[];
  transcriptAvailable: boolean;
  perceptionAvailable: boolean;
  extraLimitations: string[];
}

/**
 * Assemble le compte rendu final : normalisation des longueurs, complétion des
 * huit compétences et **recalcul systématique de la note globale**.
 */
export function buildCoachReport(input: BuildReportInput): CoachReport {
  const competencies = normaliseCompetencies(input.output.competencies);
  const overallScore = computeOverallScore(competencies);

  const priorityId = normalisePriorityId(input.output.pedagogicalPriority.competencyId, competencies);
  const priorityEntry = COACH_COMPETENCY_SCALE.find((entry) => entry.id === priorityId)!;

  return {
    reportId: input.reportId,
    conversationId: input.conversationId,
    generatedAt: new Date().toISOString(),
    model: input.model,
    commercial: { id: input.commercial.id, name: input.commercial.name },
    prospect: { id: "julie-dupont", name: "Julie Dupont" },
    session: {
      date: input.sessionDate,
      durationSeconds: input.durationSeconds,
      selectedObjectiveIds: input.selectedObjectiveIds,
      selectedObjectiveLabels: input.selectedObjectiveLabels,
      outcome: input.output.outcome,
      outcomeLabel: truncate(input.output.outcomeLabel, MAX_SHORT_TEXT),
    },
    overallScore,
    // Le libellé doit rester très court : au-delà, on préfère un repli net à une
    // phrase tronquée par des points de suspension.
    scoreInterpretation: shortInterpretation(input.output.scoreInterpretation, overallScore),
    competencies,
    psychologicalState: {
      confidence: clampInteger(input.output.psychologicalState.confidence, 0, 100),
      interest: clampInteger(input.output.psychologicalState.interest, 0, 100),
      understanding: clampInteger(input.output.psychologicalState.understanding, 0, 100),
      perceivedValue: clampInteger(input.output.psychologicalState.perceivedValue, 0, 100),
      feltPressure: clampInteger(input.output.psychologicalState.feltPressure, 0, 100),
    },
    strengths: normaliseHighlights(input.output.strengths, "Point fort non précisé"),
    improvements: normaliseHighlights(input.output.improvements, "Axe non précisé"),
    nextActions: normaliseActions(input.output.nextActions),
    keyMoments: normaliseKeyMoments(input.output.keyMoments),
    missedOpportunities: normaliseMissedOpportunities(input.output.missedOpportunities),
    commercialSummary: truncate(input.output.commercialSummary, MAX_COMMERCIAL_SUMMARY),
    managerSummary: truncate(input.output.managerSummary, MAX_MANAGER_SUMMARY),
    pedagogicalPriority: {
      competencyId: priorityId,
      label: priorityEntry.label,
      reason: truncate(input.output.pedagogicalPriority.reason, MAX_SHORT_TEXT),
    },
    confidenceLevel: input.output.confidenceLevel,
    limitations: [
      ...input.extraLimitations,
      ...input.output.limitations.map((limitation) => truncate(limitation, MAX_SHORT_TEXT)),
    ].filter((limitation) => limitation.length > 0),
    transcriptAvailable: input.transcriptAvailable,
    perceptionAvailable: input.perceptionAvailable,
  };
}

/** Garantit exactement huit compétences, dans l'ordre du barème. */
function normaliseCompetencies(
  raw: CoachModelOutput["competencies"],
): CoachCompetencyScore[] {
  return COACH_COMPETENCY_SCALE.map((entry) => {
    const match = raw.find((item) => item.id === entry.id);
    return {
      id: entry.id,
      label: entry.label,
      score: clampInteger(match?.score ?? 0, 0, 10),
      weight: entry.weight,
      observation: truncate(
        match?.observation ?? "Cette compétence n'a pas pu être observée pendant l'échange.",
        MAX_SHORT_TEXT,
      ),
      evidence: normaliseEvidence(match?.evidence ?? []),
    };
  });
}

function normaliseEvidence(raw: CoachModelOutput["competencies"][number]["evidence"]): CoachEvidence[] {
  return raw.slice(0, 3).map((item) => ({
    timestampSeconds: Math.max(0, Math.round(item.timestampSeconds)),
    speaker: item.speaker,
    excerpt: truncate(item.excerpt, MAX_SHORT_TEXT),
  }));
}

/** Exactement trois éléments : complétés si le modèle en renvoie moins. */
function normaliseHighlights(
  raw: CoachModelOutput["strengths"],
  fallbackTitle: string,
): CoachHighlight[] {
  const items = raw.slice(0, 3).map((item) => ({
    title: truncate(item.title, 90),
    explanation: truncate(item.explanation, MAX_SHORT_TEXT),
    timestampSeconds:
      item.timestampSeconds === null ? null : Math.max(0, Math.round(item.timestampSeconds)),
  }));

  while (items.length < 3) {
    items.push({
      title: fallbackTitle,
      explanation: "Le Coach n'a pas identifié suffisamment d'éléments sur ce point.",
      timestampSeconds: null,
    });
  }

  return items;
}

function normaliseActions(raw: CoachModelOutput["nextActions"]): CoachNextAction[] {
  const items = raw.slice(0, 3).map((item) => ({
    title: truncate(item.title, 90),
    instruction: truncate(item.instruction, MAX_SHORT_TEXT),
  }));

  while (items.length < 3) {
    items.push({
      title: "Action non précisée",
      instruction: "À définir avec votre responsable lors du prochain point.",
    });
  }

  return items;
}

/** Entre trois et six moments clés, triés chronologiquement. */
function normaliseKeyMoments(raw: CoachModelOutput["keyMoments"]): CoachKeyMoment[] {
  return raw
    .slice(0, 6)
    .map((item) => ({
      timestampSeconds: Math.max(0, Math.round(item.timestampSeconds)),
      type: item.type,
      title: truncate(item.title, 90),
      explanation: truncate(item.explanation, MAX_SHORT_TEXT),
    }))
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds);
}

function normaliseMissedOpportunities(
  raw: CoachModelOutput["missedOpportunities"],
): CoachMissedOpportunity[] {
  return raw.slice(0, 4).map((item) => ({
    timestampSeconds:
      item.timestampSeconds === null ? null : Math.max(0, Math.round(item.timestampSeconds)),
    title: truncate(item.title, 90),
    explanation: truncate(item.explanation, MAX_SHORT_TEXT),
  }));
}

function normalisePriorityId(
  candidate: string,
  competencies: CoachCompetencyScore[],
): CompetencyId {
  const known = COACH_COMPETENCY_SCALE.find((entry) => entry.id === candidate);
  if (known) return known.id;

  // Repli : la compétence la plus fragile, pondérée par son poids.
  const weakest = [...competencies].sort(
    (a, b) => a.score * a.weight - b.score * b.weight,
  )[0];
  return weakest.id;
}

/** Libellé de score : conservé s'il est réellement court, remplacé sinon. */
function shortInterpretation(value: string, overallScore: number): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length > 0 && trimmed.length <= 70) return trimmed;
  return defaultScoreInterpretation(overallScore);
}

function truncate(value: string, max: number): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
