"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { MethodologySheet } from "@/src/types/methodology";
import type { Question } from "@/src/types/qcm/quiz";
import {
  getOverridesLoaded,
  getServerOverridesLoaded,
  getOverridesSnapshot,
  getServerOverridesSnapshot,
  subscribeToOverrides,
} from "@/src/lib/content/content-overrides-repository";
import type { QuestionPatch, SheetPatch } from "@/src/lib/content/content-overrides-repository";

function usePublishedOverrides() {
  return useSyncExternalStore(
    subscribeToOverrides,
    getOverridesSnapshot,
    getServerOverridesSnapshot,
  );
}

/**
 * Fusionne le contenu publié par le manager sur une fiche méthodologique.
 *
 * Rendue côté serveur, la fiche reste le contenu statique d'origine — aucun
 * écart d'hydratation, puisque le stockage n'existe que côté client. La
 * version corrigée s'affiche dès l'hydratation si une publication existe.
 */
export function useEffectiveSheet(base: MethodologySheet): MethodologySheet {
  const overrides = usePublishedOverrides();
  return useMemo(() => {
    const found = overrides.find(
      (item) => item.kind === "sheet" && item.targetId === base.slug && item.status === "published",
    );
    if (!found) return base;
    const patch = found.patch as SheetPatch;
    return {
      ...base,
      objective: patch.objective ?? base.objective,
      stakes: patch.stakes ?? base.stakes,
      goodReflexes: patch.goodReflexes ?? base.goodReflexes,
      phrasesToUse: patch.phrasesToUse ?? base.phrasesToUse,
      phrasesToAvoid: patch.phrasesToAvoid ?? base.phrasesToAvoid,
      usefulQuestions: patch.usefulQuestions ?? base.usefulQuestions,
      checklist: patch.checklist ?? base.checklist,
      trainerTip: patch.trainerTip
        ? { ...base.trainerTip, text: patch.trainerTip }
        : base.trainerTip,
    };
  }, [base, overrides]);
}

/** Applique la même fusion à une liste de questions, par identifiant. */
export function useEffectiveQuestions<T extends readonly Question[]>(base: T): Question[] {
  const overrides = usePublishedOverrides();
  return useMemo(() => {
    if (overrides.length === 0) return [...base];
    return base.map((question) => {
      const found = overrides.find(
        (item) => item.kind === "question" && item.targetId === question.id && item.status === "published",
      );
      if (!found) return question;
      const patch = found.patch as QuestionPatch;

      if (question.kind === "ordering") {
        // Les questions de réordonnancement ne sont pas éditables dans cette
        // version : seuls l'énoncé, l'explication et le conseil terrain le sont.
        return {
          ...question,
          prompt: patch.prompt ?? question.prompt,
          explanation: patch.explanation ?? question.explanation,
          fieldTip: patch.fieldTip ?? question.fieldTip,
        };
      }

      return {
        ...question,
        prompt: patch.prompt ?? question.prompt,
        explanation: patch.explanation ?? question.explanation,
        fieldTip: patch.fieldTip ?? question.fieldTip,
        options: patch.options ?? question.options,
      };
    });
  }, [base, overrides]);
}

/** Statut d'un contenu pour l'écran manager : d'origine, brouillon, ou publié. */
export function useContentStatus(kind: "sheet" | "question", targetId: string) {
  const overrides = usePublishedOverrides();
  return useMemo(() => {
    const found = overrides.find((item) => item.kind === kind && item.targetId === targetId);
    return found?.status ?? "original";
  }, [overrides, kind, targetId]);
}

/** Vrai une fois les écarts de contenu relus depuis le serveur. */
export function useOverridesLoaded(): boolean {
  return useSyncExternalStore(subscribeToOverrides, getOverridesLoaded, getServerOverridesLoaded);
}
