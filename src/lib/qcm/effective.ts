import type { Question } from "@/src/types/qcm/quiz";

/** Écart publié par le manager sur une question (structure partagée client / serveur). */
export interface QuestionPatchLike {
  prompt?: string;
  explanation?: string;
  fieldTip?: string;
  options?: { id: string; label: string; correct: boolean; rationale: string }[];
}

/**
 * Applique un écart publié à une question. Utilisé à l'affichage (navigateur)
 * comme à la correction (serveur) : les deux voient exactement la même question.
 * Les questions de classement ne sont pas éditables, seuls les textes changent.
 */
export function applyQuestionPatch(question: Question, patch: QuestionPatchLike | undefined): Question {
  if (!patch) return question;
  const texts = {
    prompt: patch.prompt ?? question.prompt,
    explanation: patch.explanation ?? question.explanation,
    fieldTip: patch.fieldTip ?? question.fieldTip,
  };
  if (question.kind === "ordering") return { ...question, ...texts };
  return { ...question, ...texts, options: patch.options ?? question.options };
}
