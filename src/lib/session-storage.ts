"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Clés `sessionStorage` partagées entre la préparation de simulation, l'appel
 * Tavus et la future analyse par le Coach IA. Centralisées ici pour éviter
 * les chaînes dupliquées entre les pages.
 */
export const SELECTED_OBJECTIVES_STORAGE_KEY = "niceMatinSelectedObjectiveIds";
export const LAST_CONVERSATION_ID_STORAGE_KEY = "niceMatinLastConversationId";
export const LAST_REPORT_ID_STORAGE_KEY = "niceMatinLastReportId";

/** Enregistre les objectifs pédagogiques choisis avant de lancer l'appel. */
export function storeSelectedObjectiveIds(objectiveIds: string[]): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SELECTED_OBJECTIVES_STORAGE_KEY, JSON.stringify(objectiveIds));
}

/** Relit les objectifs pédagogiques choisis, par exemple pour les afficher pendant l'appel. */
export function readSelectedObjectiveIds(): string[] {
  return parseObjectiveIdsJson(
    typeof window === "undefined" ? null : window.sessionStorage.getItem(SELECTED_OBJECTIVES_STORAGE_KEY),
  );
}

function parseObjectiveIdsJson(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function subscribeToNothing() {
  // sessionStorage ne notifie pas les changements faits depuis le même onglet :
  // la valeur n'est lue qu'au montage, il n'y a donc rien à observer ensuite.
  return () => {};
}

function getObjectiveIdsRawSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SELECTED_OBJECTIVES_STORAGE_KEY);
}

function getObjectiveIdsServerSnapshot(): string | null {
  return null;
}

/**
 * Lit les objectifs pédagogiques sélectionnés depuis `sessionStorage` sans
 * provoquer d'avertissement d'hydratation : la page est prérendue en statique
 * (aucune donnée navigateur côté serveur), `useSyncExternalStore` gère donc
 * proprement la synchronisation lors du premier rendu client.
 */
export function useSelectedObjectiveIds(): string[] {
  const raw = useSyncExternalStore(
    subscribeToNothing,
    getObjectiveIdsRawSnapshot,
    getObjectiveIdsServerSnapshot,
  );
  return useMemo(() => parseObjectiveIdsJson(raw), [raw]);
}

/** Enregistre l'identifiant de la conversation Tavus terminée, pour l'analyse. */
export function storeLastConversationId(conversationId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LAST_CONVERSATION_ID_STORAGE_KEY, conversationId);
}

/** Relit l'identifiant de la dernière conversation terminée. */
export function readLastConversationId(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(LAST_CONVERSATION_ID_STORAGE_KEY);
  return value && value.trim().length > 0 ? value : null;
}

/** Mémorise le dernier compte rendu produit, pour y revenir rapidement. */
export function storeLastReportId(reportId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LAST_REPORT_ID_STORAGE_KEY, reportId);
}

export const LAST_CALL_SESSION_STORAGE_KEY = "niceMatinLastCallSession";

/**
 * Trace locale de l'appel qui vient de se terminer.
 *
 * Sert de repli d'affichage si Tavus tarde à fournir ses propres métadonnées.
 * Les valeurs faisant autorité restent celles renvoyées par Tavus au moment
 * de l'analyse.
 */
export interface LastCallSession {
  conversationId: string;
  /** Date ISO de fin d'appel. */
  endedAt: string;
  /** Durée mesurée côté navigateur, en secondes. */
  durationSeconds: number;
  selectedObjectiveIds: string[];
}

export function storeLastCallSession(session: LastCallSession): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LAST_CALL_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function readLastCallSession(): LastCallSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(LAST_CALL_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as LastCallSession).conversationId === "string"
    ) {
      return parsed as LastCallSession;
    }
    return null;
  } catch {
    return null;
  }
}
