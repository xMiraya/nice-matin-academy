"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { CoachReport } from "@/src/types/coach";
import {
  getReportsLoaded,
  getReportsSnapshot,
  getServerReportsLoaded,
  getServerReportsSnapshot,
  subscribeToReports,
} from "@/src/lib/reports/report-repository";

/** Comptes rendus de l'utilisateur connecté (toute l'équipe pour un manager). */
export function useReports(): CoachReport[] {
  return useSyncExternalStore(
    subscribeToReports,
    getReportsSnapshot,
    getServerReportsSnapshot,
  );
}

export function useReport(reportId: string): CoachReport | null {
  const reports = useReports();
  return useMemo(
    () => reports.find((report) => report.reportId === reportId) ?? null,
    [reports, reportId],
  );
}

/**
 * Indique si la première lecture du serveur est terminée.
 * Permet de distinguer « chargement en cours » de « compte rendu introuvable ».
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeToReports, getReportsLoaded, getServerReportsLoaded);
}
