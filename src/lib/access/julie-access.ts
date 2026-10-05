"use client";

import { useCallback, useEffect, useState } from "react";

export interface RequirementStatus {
  title: string;
  type: "QUIZ" | "ASSESSMENT";
  targetId: string;
  completed: boolean;
  bestScore: number | null;
  requiredScore: number;
  passed: boolean;
}

export interface JulieAccess {
  eligible: boolean;
  requiredScore: number;
  message: string;
  requirements: RequirementStatus[];
  passedCount: number;
  totalCount: number;
  viaOverride: boolean;
  override: { reason: string; grantedAt: string; expiresAt: string | null } | null;
}

const REFRESH_EVENT = "nicematin:julie-access-refresh";

/** Demande à tous les écrans affichés de relire l'état de déverrouillage. */
export function refreshJulieAccess(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_EVENT));
}

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; access: JulieAccess };

/** État de déverrouillage de Julie, relu à l'affichage, au retour sur l'onglet et après chaque tentative. */
export function useJulieAccess(initial?: JulieAccess): State & { reload: () => void } {
  const [state, setState] = useState<State>(
    initial ? { status: "ready", access: initial } : { status: "loading" },
  );

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/simulations/julie/access", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setState({ status: "ready", access: (await response.json()) as JulieAccess });
    } catch {
      setState((current) => (current.status === "ready" ? current : { status: "error" }));
    }
  }, []);

  useEffect(() => {
    // Différé d'un tour : pas de mise à jour d'état synchrone dans le corps de l'effet.
    const first = window.setTimeout(() => void load(), 0);
    const onRefresh = () => void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener(REFRESH_EVENT, onRefresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener(REFRESH_EVENT, onRefresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { ...state, reload: () => void load() };
}

/**
 * Envoie une tentative au serveur, qui la corrige lui-même. Ne bloque jamais
 * l'affichage du résultat : une erreur réseau est simplement renvoyée.
 */
export async function submitAttemptToServer(input: {
  kind: "QUIZ" | "ASSESSMENT";
  targetId: string;
  answers: Record<string, readonly string[]>;
  durationSeconds: number;
}): Promise<boolean> {
  try {
    const response = await fetch("/api/qcm/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    refreshJulieAccess();
    return response.ok;
  } catch {
    return false;
  }
}
