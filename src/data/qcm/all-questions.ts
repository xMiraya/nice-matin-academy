import type { Question } from "@/src/types/qcm/quiz";
import { ALL_TRAINING_QUESTIONS } from "@/src/data/qcm/training-questions";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";

export interface IndexedQuestion {
  question: Question;
  /** D'où vient la question, pour l'affichage dans l'éditeur manager. */
  source: string;
}

/**
 * Toutes les questions du dispositif, entraînement et évaluations confondus,
 * dédupliquées par identifiant. Sert uniquement à l'écran manager de gestion
 * du contenu : la banque d'entraînement et les cinq évaluations restent des
 * sources indépendantes pour le reste de l'application.
 */
export function allQuestionsIndexed(): IndexedQuestion[] {
  const seen = new Map<string, IndexedQuestion>();

  for (const question of ALL_TRAINING_QUESTIONS) {
    seen.set(question.id, { question, source: "Entraînement ciblé" });
  }

  for (const assessment of ASSESSMENTS) {
    for (const question of assessment.questions) {
      if (!seen.has(question.id)) {
        seen.set(question.id, { question, source: `Évaluation — ${assessment.levelLabel}` });
      }
    }
  }

  return [...seen.values()];
}
