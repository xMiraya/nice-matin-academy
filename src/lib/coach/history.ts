import type { SessionDifficulty } from "@/src/types";
import { COACH_COMPETENCY_SCALE } from "@/src/lib/coach/competency-scale";

/**
 * Mémoire pédagogique : résumé compact des simulations précédentes d'un commercial.
 *
 * Ce résumé est transmis au Coach uniquement pour lire la progression. Il ne
 * contient ni transcript, ni extrait, ni résumé rédigé : seulement des notes,
 * la priorité donnée et les actions demandées. Il n'entre jamais dans le calcul
 * des notes de la simulation en cours.
 *
 * Les anciens comptes rendus sont lus de façon défensive : tout champ absent ou
 * invalide est ignoré, et un rapport inexploitable est écarté sans erreur.
 */

export const MAX_HISTORY_REPORTS = 3;
const MAX_TEXT = 200;

const DIFFICULTIES: SessionDifficulty[] = ["facile", "intermediaire", "difficile"];

export interface PreviousReportSummary {
  /** Date ISO de la simulation (début de session, à défaut date du rapport). */
  date: string;
  overallScore: number | null;
  difficulty: SessionDifficulty | null;
  /** Notes sur 10 des compétences connues du barème, quand elles sont disponibles. */
  competencies: { id: string; label: string; score: number }[];
  priority: { competencyId: string; label: string; reason: string } | null;
  nextActions: { title: string; instruction: string }[];
  /** Mission fixée à l'issue de cette simulation, pour les rapports qui en portent une. */
  mission: { title: string; instruction: string; competencyId: string; successCriteria: string } | null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length <= MAX_TEXT ? trimmed : `${trimmed.slice(0, MAX_TEXT - 1).trimEnd()}…`;
};

const labelOf = (id: string): string | null =>
  COACH_COMPETENCY_SCALE.find((entry) => entry.id === id)?.label ?? null;

const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Résumé d'un rapport, ou null s'il n'apporte aucune information exploitable. */
export function summariseReport(raw: unknown): PreviousReportSummary | null {
  if (!isObject(raw)) return null;

  const session = isObject(raw.session) ? raw.session : {};
  const date = text(session.date) ?? text(raw.generatedAt);
  if (!date) return null;

  const competencies: PreviousReportSummary["competencies"] = [];
  if (Array.isArray(raw.competencies)) {
    for (const item of raw.competencies) {
      if (!isObject(item) || typeof item.id !== "string") continue;
      const label = labelOf(item.id);
      const score = finite(item.score);
      if (!label || score === null) continue;
      competencies.push({ id: item.id, label, score: Math.min(10, Math.max(0, Math.round(score))) });
    }
  }

  const overallScore = finite(raw.overallScore);

  let priority: PreviousReportSummary["priority"] = null;
  if (isObject(raw.pedagogicalPriority) && typeof raw.pedagogicalPriority.competencyId === "string") {
    const label = labelOf(raw.pedagogicalPriority.competencyId);
    if (label) {
      priority = {
        competencyId: raw.pedagogicalPriority.competencyId,
        label,
        reason: text(raw.pedagogicalPriority.reason) ?? "",
      };
    }
  }

  const nextActions: PreviousReportSummary["nextActions"] = [];
  if (Array.isArray(raw.nextActions)) {
    for (const item of raw.nextActions) {
      if (!isObject(item)) continue;
      const title = text(item.title);
      const instruction = text(item.instruction);
      if (title || instruction) nextActions.push({ title: title ?? "", instruction: instruction ?? "" });
    }
  }

  let mission: PreviousReportSummary["mission"] = null;
  if (isObject(raw.nextMission)) {
    const title = text(raw.nextMission.title);
    const instruction = text(raw.nextMission.instruction);
    if (title && instruction) {
      mission = {
        title,
        instruction,
        competencyId: typeof raw.nextMission.competencyId === "string" ? raw.nextMission.competencyId : "",
        successCriteria: text(raw.nextMission.successCriteria) ?? "",
      };
    }
  }

  // Un rapport sans note ni consigne n'apprend rien au Coach.
  if (overallScore === null && competencies.length === 0 && !priority && nextActions.length === 0) {
    return null;
  }

  const difficulty = DIFFICULTIES.find((value) => value === session.difficulty) ?? null;

  return {
    date,
    overallScore: overallScore === null ? null : Math.min(100, Math.max(0, Math.round(overallScore))),
    difficulty,
    competencies,
    priority,
    nextActions: nextActions.slice(0, 3),
    mission,
  };
}

/**
 * Construit l'historique compact : au plus trois rapports exploitables, du plus
 * récent au plus ancien. Ne lève jamais d'erreur.
 */
export function buildHistorySummaries(
  rawReports: unknown[],
  max: number = MAX_HISTORY_REPORTS,
): PreviousReportSummary[] {
  const summaries: PreviousReportSummary[] = [];
  for (const raw of rawReports) {
    try {
      const summary = summariseReport(raw);
      if (summary) summaries.push(summary);
    } catch {
      // Rapport illisible : ignoré, l'analyse courante n'en dépend pas.
    }
  }
  const time = (summary: PreviousReportSummary) => {
    const parsed = Date.parse(summary.date);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  return summaries.sort((a, b) => time(b) - time(a)).slice(0, Math.max(0, max));
}

const DIFFICULTY_LABELS: Record<SessionDifficulty, string> = {
  facile: "facile",
  intermediaire: "intermédiaire",
  difficile: "difficile",
};

/** Bloc de texte transmis au Coach. */
export function formatHistoryBlock(history: PreviousReportSummary[]): string {
  const lines: string[] = ["# HISTORIQUE PÉDAGOGIQUE DU COMMERCIAL"];

  if (history.length === 0) {
    lines.push(
      "Aucun rapport précédent : c'est la première simulation analysée. Ne fais aucune comparaison.",
    );
    return lines.join("\n");
  }

  lines.push(
    "Résumés des simulations précédentes, de la plus récente à la plus ancienne. Ils servent uniquement à lire la progression : ils ne doivent influencer aucune note de la simulation actuelle.",
  );

  history.forEach((entry, index) => {
    lines.push("");
    lines.push(`## Simulation précédente n°${index + 1}${index === 0 ? " (la plus récente)" : ""}`);
    lines.push(`- Date : ${entry.date.slice(0, 10)}`);
    lines.push(`- Note globale : ${entry.overallScore === null ? "non disponible" : `${entry.overallScore}/100`}`);
    lines.push(`- Niveau joué : ${entry.difficulty ? DIFFICULTY_LABELS[entry.difficulty] : "non précisé"}`);
    lines.push(
      `- Notes par compétence (sur 10) : ${
        entry.competencies.length > 0
          ? entry.competencies.map((item) => `${item.label} (${item.id}) ${item.score}`).join(" ; ")
          : "non disponibles"
      }`,
    );
    lines.push(
      `- Priorité pédagogique donnée : ${
        entry.priority
          ? `${entry.priority.label} (${entry.priority.competencyId})${entry.priority.reason ? ` — ${entry.priority.reason}` : ""}`
          : "non disponible"
      }`,
    );
    if (entry.nextActions.length > 0) {
      lines.push("- Actions recommandées :");
      entry.nextActions.forEach((action) => {
        lines.push(`  • ${[action.title, action.instruction].filter(Boolean).join(" : ")}`);
      });
    } else {
      lines.push("- Actions recommandées : non disponibles");
    }
    if (entry.mission) {
      lines.push(
        `- Mission fixée pour la simulation suivante : ${entry.mission.title} : ${entry.mission.instruction}${
          entry.mission.successCriteria ? ` (critère de réussite : ${entry.mission.successCriteria})` : ""
        }`,
      );
    }
  });

  return lines.join("\n");
}
