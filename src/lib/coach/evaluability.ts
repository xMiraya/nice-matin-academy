import type { CoachReport } from "@/src/types/coach";

/**
 * Évaluabilité d'une simulation.
 *
 * Le statut décrit la qualité technique des données disponibles, jamais la
 * qualité commerciale : un mauvais commercial, un refus rapide ou une note très
 * faible restent évaluables. Seule l'absence de matière à évaluer rend une
 * simulation « non évaluable » (par exemple, aucune parole du commercial).
 *
 * La décision est déterministe, prise côté serveur avant tout appel OpenAI, et
 * relue à l'identique pour les anciens comptes rendus qui n'ont pas de statut.
 */

export type EvaluationStatus = "evaluable" | "not_evaluable";

export type NonEvaluableReason =
  /** Le transcript ne contient aucune parole du commercial. */
  | "no_commercial_speech"
  /** Aucun tour de parole exploitable n'a été produit. */
  | "transcript_unavailable"
  /** Le commercial n'a prononcé que quelques mots : rien à noter. */
  | "insufficient_usable_data";

export type Eligibility =
  | { evaluable: true }
  | { evaluable: false; reason: NonEvaluableReason };

/** Un tour de parole, indépendamment de la source (Tavus ou compte rendu enregistré). */
export interface SpokenTurn {
  fromCommercial: boolean;
  text: string;
}

/**
 * Nombre minimal de mots prononcés par le commercial, tous tours confondus.
 * Volontairement bas : un commercial qui parle peu reste évaluable dès qu'une
 * performance est observable. Un simple « Allô ? » ne l'est pas.
 */
export const MIN_COMMERCIAL_WORDS = 3;

const WORD = /[\p{L}\p{N}]/u;

function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((token) => token.length > 0 && WORD.test(token)).length;
}

export function evaluateTurnsEligibility(turns: SpokenTurn[]): Eligibility {
  const usable = turns.filter((turn) => typeof turn?.text === "string" && countWords(turn.text) > 0);
  if (usable.length === 0) return { evaluable: false, reason: "transcript_unavailable" };

  const commercialWords = usable
    .filter((turn) => turn.fromCommercial)
    .reduce((sum, turn) => sum + countWords(turn.text), 0);

  if (commercialWords === 0) return { evaluable: false, reason: "no_commercial_speech" };
  if (commercialWords < MIN_COMMERCIAL_WORDS) {
    return { evaluable: false, reason: "insufficient_usable_data" };
  }
  return { evaluable: true };
}

/** Transcript nettoyé tel qu'il est envoyé au Coach (rôles `user` / `assistant`). */
export function evaluateTranscriptEligibility(
  transcript: { role: "user" | "assistant"; content: string }[],
): Eligibility {
  return evaluateTurnsEligibility(
    transcript.map((entry) => ({ fromCommercial: entry.role === "user", text: entry.content })),
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const REASONS: NonEvaluableReason[] = [
  "no_commercial_speech",
  "transcript_unavailable",
  "insufficient_usable_data",
];

/**
 * Évaluabilité d'un compte rendu enregistré.
 *
 * - statut présent : il fait foi ;
 * - sinon (ancien rapport) : déduit du dialogue conservé dans le rapport ;
 * - sinon (dialogue non conservé) : prudemment considéré comme évaluable, car
 *   rien ne prouve le contraire.
 */
export function reportEvaluability(report: unknown): Eligibility {
  if (!isObject(report)) return { evaluable: true };

  if (report.evaluationStatus === "not_evaluable") {
    const reason = REASONS.find((value) => value === report.nonEvaluableReason);
    return { evaluable: false, reason: reason ?? "insufficient_usable_data" };
  }
  if (report.evaluationStatus === "evaluable") return { evaluable: true };

  if (!Array.isArray(report.transcript)) return { evaluable: true };

  const turns: SpokenTurn[] = [];
  for (const line of report.transcript) {
    if (!isObject(line) || typeof line.text !== "string") continue;
    turns.push({ fromCommercial: line.speaker === "commercial", text: line.text });
  }
  return evaluateTurnsEligibility(turns);
}

export function isEvaluatedReport(report: CoachReport): boolean {
  return reportEvaluability(report).evaluable;
}

/** Rapports réellement évalués : seuls ceux-ci alimentent scores, progression et statistiques. */
export function evaluatedReports(reports: CoachReport[]): CoachReport[] {
  return reports.filter(isEvaluatedReport);
}

export const NON_EVALUABLE_TITLES = "Simulation non évaluée";

/** Message adressé au commercial, selon la raison. */
export const NON_EVALUABLE_MESSAGES: Record<NonEvaluableReason, string> = {
  no_commercial_speech:
    "Aucune parole du commercial n'a été détectée pendant cet entretien. Cette simulation n'est donc pas prise en compte dans votre progression.",
  transcript_unavailable:
    "Aucun échange exploitable n'a été enregistré pendant cet entretien. Cette simulation n'est donc pas prise en compte dans votre progression.",
  insufficient_usable_data:
    "L'entretien ne contient pas suffisamment de données exploitables pour évaluer votre performance. Cette simulation n'est donc pas prise en compte dans votre progression.",
};

/** Libellé technique court, destiné au manager et à la traçabilité. */
export const NON_EVALUABLE_REASON_LABELS: Record<NonEvaluableReason, string> = {
  no_commercial_speech: "Aucune parole du commercial dans le transcript",
  transcript_unavailable: "Aucun tour de parole exploitable",
  insufficient_usable_data: "Parole du commercial insuffisante pour être évaluée",
};

export function nonEvaluableReasonOf(report: CoachReport): NonEvaluableReason | null {
  const eligibility = reportEvaluability(report);
  return eligibility.evaluable ? null : eligibility.reason;
}
