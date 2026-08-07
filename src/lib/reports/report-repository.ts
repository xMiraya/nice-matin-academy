import { z } from "zod";
import type { CoachReport } from "@/src/types/coach";

/**
 * Couche de stockage des comptes rendus du Coach.
 *
 * ⚠️ AVERTISSEMENT
 * Le stockage navigateur est adapté à une démonstration locale, mais ne
 * constitue pas un stockage multi-utilisateur ou durable pour la production
 * Nice-Matin.
 *
 * Conséquences concrètes de cette implémentation :
 * - les comptes rendus ne suivent ni l'utilisateur, ni l'appareil, ni le navigateur ;
 * - un manager ne voit pas les analyses produites sur un autre poste ;
 * - vider les données du navigateur supprime définitivement l'historique ;
 * - aucune sauvegarde, aucun contrôle d'accès, aucune traçabilité ;
 * - la capacité est limitée (quelques mégaoctets selon le navigateur).
 *
 * À remplacer par une base interne sécurisée avant toute mise en production.
 * Aucune autre partie de l'application ne doit accéder directement à
 * `localStorage` pour les rapports : tout passe par cette interface, afin que
 * la substitution se fasse sans effet de bord.
 *
 * Ne sont stockés ici que des comptes rendus déjà assainis : ni clé, ni prompt
 * système, ni transcript intégral.
 */

export interface ReportRepository {
  getAllReports(): CoachReport[];
  getReportById(reportId: string): CoachReport | null;
  getReportByConversationId(conversationId: string): CoachReport | null;
  saveReport(report: CoachReport): void;
  deleteReport(reportId: string): void;
}

const STORAGE_KEY = "niceMatinCoachReports";

/* ------------------------------------------------------------------ */
/* Validation à la lecture                                             */
/* ------------------------------------------------------------------ */

const EvidenceSchema = z.object({
  timestampSeconds: z.number(),
  speaker: z.enum(["commercial", "julie"]),
  excerpt: z.string(),
});

const CompetencySchema = z.object({
  id: z.string(),
  label: z.string(),
  score: z.number(),
  weight: z.number(),
  observation: z.string(),
  evidence: z.array(EvidenceSchema),
});

const HighlightSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  timestampSeconds: z.number().nullable(),
});

const StoredReportSchema = z.object({
  reportId: z.string(),
  conversationId: z.string(),
  generatedAt: z.string(),
  model: z.string(),
  commercial: z.object({ id: z.string(), name: z.string() }),
  prospect: z.object({ id: z.string(), name: z.string() }),
  session: z.object({
    date: z.string(),
    durationSeconds: z.number(),
    selectedObjectiveIds: z.array(z.string()),
    selectedObjectiveLabels: z.array(z.string()),
    outcome: z.enum(["accepted", "refused", "postponed", "interrupted", "inconclusive"]),
    outcomeLabel: z.string(),
  }),
  overallScore: z.number(),
  scoreInterpretation: z.string(),
  competencies: z.array(CompetencySchema),
  psychologicalState: z.object({
    confidence: z.number(),
    interest: z.number(),
    understanding: z.number(),
    perceivedValue: z.number(),
    feltPressure: z.number(),
  }),
  strengths: z.array(HighlightSchema),
  improvements: z.array(HighlightSchema),
  nextActions: z.array(z.object({ title: z.string(), instruction: z.string() })),
  keyMoments: z.array(
    z.object({
      timestampSeconds: z.number(),
      type: z.enum(["positive", "warning", "objection", "turning_point", "conclusion"]),
      title: z.string(),
      explanation: z.string(),
    }),
  ),
  missedOpportunities: z.array(
    z.object({
      timestampSeconds: z.number().nullable(),
      title: z.string(),
      explanation: z.string(),
    }),
  ),
  commercialSummary: z.string(),
  managerSummary: z.string(),
  pedagogicalPriority: z.object({
    competencyId: z.string(),
    label: z.string(),
    reason: z.string(),
  }),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  limitations: z.array(z.string()),
  transcriptAvailable: z.boolean(),
  perceptionAvailable: z.boolean(),
});

/* ------------------------------------------------------------------ */
/* Implémentation locale                                               */
/* ------------------------------------------------------------------ */

const EMPTY_REPORTS: CoachReport[] = [];

/**
 * Cache d'instantané : `useSyncExternalStore` exige une référence stable tant
 * que les données n'ont pas changé. On ne re-analyse donc le JSON que lorsque
 * la chaîne stockée diffère de la précédente.
 */
let cachedRaw: string | null = null;
let cachedReports: CoachReport[] = EMPTY_REPORTS;

const listeners = new Set<() => void>();
const CHANGE_EVENT = "nicematin:reports-changed";

function parseReports(raw: string | null): CoachReport[] {
  if (!raw) return EMPTY_REPORTS;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_REPORTS;
  }

  if (!Array.isArray(parsed)) return EMPTY_REPORTS;

  // Chaque entrée est validée : un rapport corrompu est ignoré sans faire
  // échouer la lecture des autres.
  const reports: CoachReport[] = [];
  for (const item of parsed) {
    const result = StoredReportSchema.safeParse(item);
    if (result.success) {
      reports.push(result.data as CoachReport);
    }
  }

  return reports.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
}

function notifyChange(): void {
  cachedRaw = null;
  for (const listener of listeners) listener();
}

/** Instantané stable des rapports, destiné à `useSyncExternalStore`. */
export function getReportsSnapshot(): CoachReport[] {
  if (typeof window === "undefined") return EMPTY_REPORTS;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedReports = parseReports(raw);
  }
  return cachedReports;
}

/** Instantané serveur : aucun rapport n'existe côté rendu serveur. */
export function getServerReportsSnapshot(): CoachReport[] {
  return EMPTY_REPORTS;
}

/** S'abonne aux changements, y compris ceux venant d'un autre onglet. */
export function subscribeToReports(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) notifyChange();
  };
  const onLocalChange = () => listener();

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onLocalChange);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onLocalChange);
    }
  };
}

class LocalReportRepository implements ReportRepository {
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  getAllReports(): CoachReport[] {
    if (!this.isBrowser()) return EMPTY_REPORTS;
    return getReportsSnapshot();
  }

  getReportById(reportId: string): CoachReport | null {
    return this.getAllReports().find((report) => report.reportId === reportId) ?? null;
  }

  getReportByConversationId(conversationId: string): CoachReport | null {
    return (
      this.getAllReports().find((report) => report.conversationId === conversationId) ?? null
    );
  }

  saveReport(report: CoachReport): void {
    if (!this.isBrowser()) return;

    const existing = this.getAllReports();
    // Un seul rapport par conversation : on remplace au lieu de dupliquer.
    const next = existing.filter(
      (item) =>
        item.conversationId !== report.conversationId && item.reportId !== report.reportId,
    );
    next.unshift(report);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notifyChange();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  deleteReport(reportId: string): void {
    if (!this.isBrowser()) return;
    const next = this.getAllReports().filter((report) => report.reportId !== reportId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notifyChange();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/** Instance unique utilisée par l'application. */
export const reportRepository: ReportRepository = new LocalReportRepository();
