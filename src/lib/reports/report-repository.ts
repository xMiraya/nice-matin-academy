import type { CoachReport } from "@/src/types/coach";
import { createRemoteStore, sendJson } from "@/src/lib/remote-store";

/**
 * Comptes rendus du Coach, stockés en base (table `reports`).
 *
 * Le serveur filtre selon le rôle : un commercial ne reçoit que les siens, un
 * manager reçoit ceux de toute l'équipe. Le compte rendu est enregistré par la
 * route d'analyse elle-même ; ce module ne fait que le lire et le supprimer.
 */

export interface ReportRepository {
  getAllReports(): CoachReport[];
  getReportById(reportId: string): CoachReport | null;
  getReportByConversationId(conversationId: string): CoachReport | null;
  /** Le compte rendu est déjà en base : on resynchronise simplement la liste. */
  saveReport(report: CoachReport): Promise<void>;
  deleteReport(reportId: string): Promise<void>;
}

const EMPTY_REPORTS: CoachReport[] = [];

const store = createRemoteStore<CoachReport[]>({
  url: "/api/reports",
  empty: EMPTY_REPORTS,
  select: (json) => (json as { reports?: CoachReport[] }).reports ?? EMPTY_REPORTS,
});

export const getReportsSnapshot = store.getSnapshot;
export const getServerReportsSnapshot = store.getServerSnapshot;
export const subscribeToReports = store.subscribe;
export const getReportsLoaded = store.getLoaded;
export const getServerReportsLoaded = store.getServerLoaded;
export const refreshReports = store.refresh;

export const reportRepository: ReportRepository = {
  getAllReports: () => store.getSnapshot(),
  getReportById: (reportId) =>
    store.getSnapshot().find((report) => report.reportId === reportId) ?? null,
  getReportByConversationId: (conversationId) =>
    store.getSnapshot().find((report) => report.conversationId === conversationId) ?? null,
  saveReport: () => store.refresh(),
  async deleteReport(reportId) {
    await sendJson(`/api/reports/${encodeURIComponent(reportId)}`, "DELETE");
    await store.refresh();
  },
};
