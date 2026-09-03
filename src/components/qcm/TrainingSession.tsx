"use client";

import { useCallback, useMemo, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/src/components/Button";
import { Correction } from "@/src/components/qcm/Correction";
import { ProgressIndicator } from "@/src/components/qcm/ProgressIndicator";
import { QuestionView } from "@/src/components/qcm/QuestionView";
import { TrainingRecap } from "@/src/components/qcm/TrainingRecap";
import { TRAINING_SAMPLE_SIZE } from "@/src/data/qcm/config";
import { qcmRoutes } from "@/src/data/qcm/routes";
import { addTraining } from "@/src/lib/qcm/progression";
import { gradeQuestion } from "@/src/lib/qcm/scoring";
import { createRng, sample } from "@/src/lib/qcm/shuffle";
import { useProgress } from "@/src/lib/qcm/useProgress";
import { useEffectiveQuestions } from "@/src/lib/content/use-effective-content";
import type { Competency } from "@/src/types/qcm/competency";
import type { AnswerValue, Question, QuestionResult } from "@/src/types/qcm/quiz";

interface Props {
  readonly competency: Competency;
  readonly pool: readonly Question[];
}

/**
 * Entraînement ciblé : tirage aléatoire de questions, correction immédiate
 * après chaque validation, et possibilité de recommencer avec un autre tirage.
 */
export function TrainingSession({ competency, pool: basePool }: Props) {
  const { update } = useProgress();
  // Applique les éventuelles publications du manager avant le tirage : le
  // reste du composant travaille sur un pool déjà à jour.
  const pool = useEffectiveQuestions(basePool);
  const [seed, setSeed] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<AnswerValue>([]);
  const [result, setResult] = useState<QuestionResult | null>(null);
  // Les résultats sont conservés pour le récapitulatif de fin de série.
  const [answered, setAnswered] = useState<readonly QuestionResult[]>([]);
  const [finished, setFinished] = useState(false);

  const questions = useMemo(() => {
    if (seed === null) return [];
    return sample(pool, TRAINING_SAMPLE_SIZE, createRng(seed));
  }, [pool, seed]);

  const start = useCallback(() => {
    setSeed(Date.now());
    setIndex(0);
    setAnswer([]);
    setResult(null);
    setAnswered([]);
    setFinished(false);
  }, []);

  if (seed === null) {
    return (
      <section className="nm-card max-w-prose p-5 sm:p-6">
        <p className="nm-label">Entraînement ciblé</p>
        <h2 className="nm-display mt-2 text-2xl text-ink">Démarrer une série</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-graphite">
          {Math.min(TRAINING_SAMPLE_SIZE, pool.length)} questions seront tirées au hasard parmi les{" "}
          {pool.length} de cette compétence. La correction s’affiche après chaque réponse, et vous
          pouvez recommencer autant de fois que vous le souhaitez.
        </p>
        <Button className="mt-5" onClick={start}>
          <Play size={15} aria-hidden />
          Démarrer l’entraînement
        </Button>
      </section>
    );
  }

  if (finished) {
    const correctCount = answered.filter((r) => r.outcome === "correct").length;

    return (
      <section className="nm-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="nm-label">Série terminée</p>
            <h2 className="nm-display mt-2 text-2xl text-ink">
              {correctCount} réponse{correctCount > 1 ? "s" : ""} entièrement correcte
              {correctCount > 1 ? "s" : ""} sur {answered.length}
            </h2>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <TrainingRecap questions={questions} results={answered} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5 border-t border-line pt-6">
          <Button onClick={start}>
            <RotateCcw size={15} aria-hidden />
            Refaire avec d’autres questions
          </Button>
          <ButtonLink href={qcmRoutes.training} variant="secondary">
            Choisir une autre compétence
          </ButtonLink>
          <ButtonLink href={qcmRoutes.assessments} variant="ghost">
            Passer une évaluation
          </ButtonLink>
        </div>
      </section>
    );
  }

  const question = questions[index];
  if (!question) return null;

  function validate() {
    if (!question) return;
    const graded = gradeQuestion(question, answer);
    setResult(graded);
    setAnswered((current) => [...current, graded]);
  }

  function next() {
    if (index + 1 >= questions.length) {
      update((current) =>
        addTraining(current, {
          competency: competency.id,
          completedAt: new Date().toISOString(),
          correct: answered.filter((r) => r.outcome === "correct").length,
          total: questions.length,
        }),
      );
      setFinished(true);
      return;
    }
    setIndex((n) => n + 1);
    setAnswer([]);
    setResult(null);
  }

  return (
    <section>
      <ProgressIndicator current={index} total={questions.length} answered={answered.length} />

      <QuestionView
        question={question}
        value={answer}
        onChange={setAnswer}
        locked={result !== null}
        index={index}
        total={questions.length}
      />

      {result ? <Correction question={question} result={result} /> : null}

      <div className="mt-5 flex flex-wrap gap-2.5">
        {result === null ? (
          <Button
            onClick={validate}
            disabled={answer.length === 0 && question.kind !== "ordering"}
          >
            Valider ma réponse
          </Button>
        ) : (
          <Button onClick={next}>
            {index + 1 >= questions.length ? "Terminer la série" : "Question suivante"}
          </Button>
        )}
        <ButtonLink href={qcmRoutes.training} variant="ghost">
          Quitter l’entraînement
        </ButtonLink>
      </div>
    </section>
  );
}
