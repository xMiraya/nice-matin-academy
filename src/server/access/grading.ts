import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { TRAINING_QUESTIONS } from "@/src/data/qcm/training-questions";
import { TRAINING_SAMPLE_SIZE } from "@/src/data/qcm/config";
import { applyQuestionPatch } from "@/src/lib/qcm/effective";
import type { QuestionPatchLike } from "@/src/lib/qcm/effective";
import { gradeQuestion } from "@/src/lib/qcm/scoring";
import type { CompetencyId } from "@/src/types/qcm/competency";
import type { Question } from "@/src/types/qcm/quiz";
import type { RequirementKind } from "@/src/server/access/eligibility";

/**
 * Correction côté serveur d'une tentative.
 *
 * Le navigateur n'envoie que ses réponses brutes (identifiants d'options ou
 * ordre proposé) : le score est recalculé ici, sur les questions du dépôt,
 * avec les corrections publiées par le manager.
 */

export interface AttemptInput {
  kind: RequirementKind;
  targetId: string;
  answers: Record<string, readonly string[]>;
  overrides: ReadonlyMap<string, QuestionPatchLike>;
}

export type GradedAttempt =
  | { ok: true; score: number; earned: number; max: number }
  | { ok: false; error: string };

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Questions concernées par une cible, ou `null` si la cible n'existe pas. */
export function questionsForTarget(kind: RequirementKind, targetId: string): readonly Question[] | null {
  if (kind === "ASSESSMENT") {
    return ASSESSMENTS.find((a) => a.id === targetId)?.questions ?? null;
  }
  return TRAINING_QUESTIONS[targetId as CompetencyId] ?? null;
}

export function gradeAttempt(input: AttemptInput): GradedAttempt {
  const pool = questionsForTarget(input.kind, input.targetId);
  if (!pool) return { ok: false, error: "Évaluation ou QCM inconnu." };

  const poolIds = new Set(pool.map((q) => q.id));
  const answeredIds = Object.keys(input.answers);
  if (answeredIds.some((id) => !poolIds.has(id))) {
    return { ok: false, error: "Réponses incohérentes avec ce QCM." };
  }

  let questions: readonly Question[];
  if (input.kind === "ASSESSMENT") {
    // Évaluation complète : toutes les questions comptent, sans réponse = 0.
    questions = pool;
  } else {
    // Entraînement ciblé : une série tirée au hasard, de taille fixe.
    const expected = Math.min(TRAINING_SAMPLE_SIZE, pool.length);
    if (answeredIds.length !== expected) {
      return { ok: false, error: "La série envoyée est incomplète." };
    }
    questions = pool.filter((q) => answeredIds.includes(q.id));
  }

  const earned = questions.reduce((sum, question) => {
    const effective = applyQuestionPatch(question, input.overrides.get(question.id));
    return sum + gradeQuestion(effective, input.answers[question.id]).earned;
  }, 0);
  const max = questions.length;
  return { ok: true, earned: round2(earned), max, score: max === 0 ? 0 : round2((earned / max) * 100) };
}
