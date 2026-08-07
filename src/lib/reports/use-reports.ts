"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { CoachReport } from "@/src/types/coach";
import {
  getReportsSnapshot,
  getServerReportsSnapshot,
  subscribeToReports,
} from "@/src/lib/reports/report-repository";

/**
 * Accès en lecture aux comptes rendus du Coach depuis les composants client.
 *
 * Passe par `useSyncExternalStore` : le rendu serveur voit une liste vide, puis
 * le client se synchronise sans provoquer d'écart d'hydratation.
 */
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

const subscribeToNothing = () => () => {};

/**
 * Indique si le composant est déjà passé côté client.
 * Permet de distinguer « chargement en cours » de « rapport introuvable ».
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
