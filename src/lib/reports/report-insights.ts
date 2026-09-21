import type { CoachReport } from "@/src/types/coach";
import type { CompetencyScore, SessionSummary } from "@/src/types";
import { COACH_COMPETENCY_SCALE } from "@/src/lib/coach/competency-scale";

/**
 * Agrégats calculés à partir des comptes rendus réels du Coach.
 *
 * Règle stricte : ces valeurs ne sont jamais mélangées avec les données de
 * démonstration. Un écran affiche soit des chiffres réels, soit des chiffres
 * fictifs explicitement marqués « Démonstration ».
 */
export interface ReportInsights {
  hasReports: boolean;
  count: number;
  latestScore: number | null;
  averageScore: number | null;
  /** Écart entre le premier et le dernier compte rendu, en points. */
  progression: number | null;
  competencyAverages: CompetencyScore[];
  strongest: { id: string; label: string; score: number } | null;
  priority: { id: string; label: string; score: number } | null;
  scoreHistory: { label: string; score: number }[];
  sessions: SessionSummary[];
}

const EMPTY_INSIGHTS: ReportInsights = {
  hasReports: false,
  count: 0,
  latestScore: null,
  averageScore: null,
  progression: null,
  competencyAverages: [],
  strongest: null,
  priority: null,
  scoreHistory: [],
  sessions: [],
};

/** Les rapports arrivent du plus récent au plus ancien. */
export function computeReportInsights(
  reports: CoachReport[],
  sessionHrefPrefix: string,
): ReportInsights {
  if (reports.length === 0) return EMPTY_INSIGHTS;

  const chronological = [...reports].sort(
    (a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt),
  );

  const scores = chronological.map((report) => report.overallScore);
  const averageScore = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const latestScore = scores.at(-1) ?? null;
  const progression = scores.length >= 2 ? (scores.at(-1) ?? 0) - (scores[0] ?? 0) : null;

  // Moyenne par compétence, exprimée sur 100 pour les graphiques existants.
  const competencyAverages: CompetencyScore[] = COACH_COMPETENCY_SCALE.map((entry) => {
    const values = chronological
      .map((report) => report.competencies.find((item) => item.id === entry.id)?.score)
      .filter((value): value is number => typeof value === "number");

    const average =
      values.length === 0
        ? 0
        : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10);

    return { competencyId: entry.id, score: average };
  });

  const ranked = [...competencyAverages].sort((a, b) => b.score - a.score);
  const labelOf = (id: string) =>
    COACH_COMPETENCY_SCALE.find((entry) => entry.id === id)?.label ?? id;

  const best = ranked[0];
  const worst = ranked.at(-1);

  return {
    hasReports: true,
    count: reports.length,
    latestScore,
    averageScore,
    progression,
    competencyAverages,
    strongest: best ? { id: best.competencyId, label: labelOf(best.competencyId), score: best.score } : null,
    priority: worst
      ? { id: worst.competencyId, label: labelOf(worst.competencyId), score: worst.score }
      : null,
    scoreHistory: chronological.map((report) => ({
      label: formatShortLabel(report.session.date),
      score: report.overallScore,
    })),
    sessions: reports.map((report) => toSessionSummary(report, sessionHrefPrefix)),
  };
}

/** Convertit un compte rendu en ligne de tableau réutilisable. */
export function toSessionSummary(report: CoachReport, hrefPrefix: string): SessionSummary {
  return {
    id: report.reportId,
    href: `${hrefPrefix}/${report.reportId}`,
    title:
      report.session.selectedObjectiveLabels.length > 0
        ? report.session.selectedObjectiveLabels.join(" · ")
        : "Simulation avec Julie Dupont",
    date: report.session.date.slice(0, 10),
    objectiveLabel: report.pedagogicalPriority.label,
    difficulty: report.session.difficulty ?? "intermediaire",
    durationSeconds: report.session.durationSeconds,
    score: report.overallScore,
    status: "terminee",
    repName: report.commercial.name,
  };
}

function formatShortLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

/** Numéro de semaine calendaire, pour comparer des semaines entre elles. */
function weekIndex(timestamp: number): number {
  const monday = new Date(timestamp);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Math.round(monday.getTime() / (7 * 86_400_000));
}

/**
 * Semaines consécutives avec au moins une simulation, en remontant depuis la
 * semaine en cours (ou la précédente, pour ne pas casser la série un lundi).
 */
export function weeklyStreak(reports: CoachReport[], now = Date.now()): number {
  const weeks = new Set(reports.map((report) => weekIndex(Date.parse(report.generatedAt))));
  let cursor = weekIndex(now);
  if (!weeks.has(cursor)) cursor -= 1;
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= 1;
  }
  return streak;
}

/** Variation de chaque compétence entre l'avant-dernier et le dernier compte rendu (sur 100). */
export function competencyDeltas(reports: CoachReport[]): Record<string, number> {
  const ordered = [...reports].sort((a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt));
  if (ordered.length < 2) return {};
  const previous = ordered.at(-2);
  const latest = ordered.at(-1);
  const deltas: Record<string, number> = {};
  for (const entry of COACH_COMPETENCY_SCALE) {
    const before = previous?.competencies.find((item) => item.id === entry.id)?.score;
    const after = latest?.competencies.find((item) => item.id === entry.id)?.score;
    if (typeof before === "number" && typeof after === "number") {
      deltas[entry.id] = Math.round((after - before) * 10);
    }
  }
  return deltas;
}
