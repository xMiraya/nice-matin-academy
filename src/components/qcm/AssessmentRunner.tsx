"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Timer } from "lucide-react";
import { Button, ButtonLink } from "@/src/components/Button";
import { ProgressIndicator } from "@/src/components/qcm/ProgressIndicator";
import { QuestionView } from "@/src/components/qcm/QuestionView";
import { MULTIPLE_CHOICE_RULE } from "@/src/data/qcm/config";
import { qcmRoutes } from "@/src/data/qcm/routes";
import { addResult, dropSession, upsertSession } from "@/src/lib/qcm/progression";
import { formatDuration, gradeAssessment } from "@/src/lib/qcm/scoring";
import { useProgress } from "@/src/lib/qcm/useProgress";
import { cx } from "@/src/lib/format";
import type { AnswerMap, AnswerValue, Assessment } from "@/src/types/qcm/quiz";

type Phase = "intro" | "running" | "review";

/**
 * Passation d'une évaluation transversale.
 * Aucune correction n'est affichée avant l'envoi : le commercial répond à tout,
 * confirme, puis découvre son résultat et la correction détaillée.
 */
export function AssessmentRunner({ assessment }: { readonly assessment: Assessment }) {
  const router = useRouter();
  const { progress, ready, update } = useProgress();

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<number | null>(null);

  const openSession = ready ? progress.openSessions[assessment.id] : undefined;
  const questions = assessment.questions;
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? []).length > 0).length,
    [questions, answers],
  );
  const missing = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? []).length === 0),
    [questions, answers],
  );

  // Compteur de temps informatif : aucun compte à rebours, aucune limite.
  useEffect(() => {
    if (phase !== "running") return undefined;
    tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [phase]);

  // Sauvegarde automatique à chaque changement de réponse.
  useEffect(() => {
    if (phase !== "running") return;
    update((current) =>
      upsertSession(current, {
        assessmentId: assessment.id,
        level: assessment.level,
        startedAt: new Date().toISOString(),
        elapsedSeconds: elapsed,
        answers,
        currentIndex: index,
      }),
    );
    // `elapsed` est volontairement exclu : il ne doit pas déclencher une écriture
    // par seconde. Il est repris lors des autres sauvegardes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, index, phase]);

  // Confirmation avant de quitter la page en cours de passation.
  useEffect(() => {
    if (phase !== "running") return undefined;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const begin = useCallback(
    (resume: boolean) => {
      if (resume && openSession) {
        setAnswers(openSession.answers);
        setIndex(openSession.currentIndex);
        setElapsed(openSession.elapsedSeconds);
      } else {
        setAnswers({});
        setIndex(0);
        setElapsed(0);
        update((current) => dropSession(current, assessment.id));
      }
      setPhase("running");
    },
    [assessment.id, openSession, update],
  );

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function submit() {
    const resultId = `${assessment.id}-${Date.now()}`;
    const result = gradeAssessment(assessment, answers, {
      durationSeconds: elapsed,
      resultId,
    });
    update((current) => addResult(current, result));
    router.push(qcmRoutes.result(resultId));
  }

  if (phase === "intro") {
    return (
      <section className="nm-card max-w-prose p-5 sm:p-6">
        <p className="nm-label">
          {assessment.kicker} · {assessment.levelLabel}
        </p>
        <h2 className="nm-display mt-2 text-2xl text-ink">{assessment.title}</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-graphite">{assessment.description}</p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-sm bg-mist/70 p-4">
            <dt className="nm-label">Questions</dt>
            <dd className="mt-1.5 text-lg font-semibold tabular-nums text-ink">
              {questions.length}
            </dd>
          </div>
          <div className="rounded-sm bg-mist/70 p-4">
            <dt className="nm-label">Durée indicative</dt>
            <dd className="mt-1.5 text-lg font-semibold text-ink">
              ~{assessment.indicativeMinutes} min
            </dd>
          </div>
          <div className="rounded-sm bg-mist/70 p-4">
            <dt className="nm-label">Correction</dt>
            <dd className="mt-1.5 text-sm font-semibold text-ink">après l’envoi complet</dd>
          </div>
        </dl>

        <p className="mt-5 rounded-sm border border-warning-bright/40 bg-warning-soft p-3.5 text-sm leading-relaxed text-ink">
          <span className="font-semibold">Règle de notation : </span>
          {MULTIPLE_CHOICE_RULE}
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-graphite">
          Le temps passé est mesuré à titre informatif : il n’y a ni compte à rebours ni limite. Vos
          réponses sont enregistrées automatiquement et vous pouvez revenir sur une question à tout
          moment.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {openSession ? (
            <>
              <Button onClick={() => begin(true)}>Reprendre où j’en étais</Button>
              <Button variant="secondary" onClick={() => begin(false)}>
                Recommencer depuis le début
              </Button>
            </>
          ) : (
            <Button onClick={() => begin(false)}>Commencer l’évaluation</Button>
          )}
          <ButtonLink href={qcmRoutes.assessments} variant="ghost">
            Retour aux niveaux
          </ButtonLink>
        </div>
      </section>
    );
  }

  if (phase === "review") {
    return (
      <section className="nm-card max-w-prose p-5 sm:p-6">
        <p className="nm-label">Écran de validation</p>
        <h2 className="nm-display mt-2 text-2xl text-ink">Avant d’envoyer vos réponses</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-graphite">
          {answeredCount} question{answeredCount > 1 ? "s" : ""} répondue
          {answeredCount > 1 ? "s" : ""} sur {questions.length}. Temps passé :{" "}
          {formatDuration(elapsed)}.
        </p>

        {missing.length > 0 ? (
          <div
            className="mt-5 rounded-sm border border-warning-bright/40 bg-warning-soft p-4"
            role="alert"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <AlertTriangle size={16} aria-hidden className="text-warning" />
              {missing.length} question{missing.length > 1 ? "s" : ""} sans réponse
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {missing.map((q) => {
                const position = questions.findIndex((item) => item.id === q.id);
                return (
                  <li key={q.id}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIndex(position);
                        setPhase("running");
                      }}
                    >
                      Aller à la question {position + 1}
                    </Button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-graphite">
              Une question sans réponse compte zéro point. Vous pouvez néanmoins envoyer maintenant.
            </p>
          </div>
        ) : (
          <p className="mt-5 flex items-center gap-2 rounded-sm border border-positive-bright/30 bg-positive-soft p-3.5 text-sm text-ink">
            <CheckCircle2 size={16} aria-hidden className="text-positive" />
            Toutes les questions ont reçu une réponse.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button onClick={submit}>Confirmer l’envoi et voir mon résultat</Button>
          <Button variant="secondary" onClick={() => setPhase("running")}>
            Revenir aux questions
          </Button>
        </div>
      </section>
    );
  }

  const question = questions[index];
  if (!question) return null;

  return (
    <section>
      <ProgressIndicator current={index} total={questions.length} answered={answeredCount} />

      <QuestionView
        question={question}
        value={answers[question.id] ?? []}
        onChange={(value) => setAnswer(question.id, value)}
        index={index}
        total={questions.length}
      />

      <p className="sr-only" aria-live="polite">
        Temps passé : {formatDuration(elapsed)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button
          variant="secondary"
          onClick={() => setIndex((n) => Math.max(0, n - 1))}
          disabled={index === 0}
        >
          Question précédente
        </Button>
        {index + 1 < questions.length ? (
          <Button onClick={() => setIndex((n) => n + 1)}>Question suivante</Button>
        ) : null}
        <Button variant={index + 1 < questions.length ? "secondary" : "primary"} onClick={() => setPhase("review")}>
          Terminer et vérifier
        </Button>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] tabular-nums text-muted">
          <Timer size={14} aria-hidden />
          {formatDuration(elapsed)}
        </span>
      </div>

      <nav aria-label="Accès direct aux questions" className="mt-7">
        <p className="nm-label">Naviguer</p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {questions.map((q, position) => {
            const done = (answers[q.id] ?? []).length > 0;
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => setIndex(position)}
                  aria-current={position === index ? "true" : undefined}
                  className={cx(
                    "h-11 min-w-11 rounded-sm border px-2 text-sm font-semibold tabular-nums transition-colors",
                    position === index
                      ? "border-brand bg-brand text-white"
                      : done
                        ? "border-brand-sky bg-brand-soft text-brand"
                        : "border-line bg-white text-muted hover:border-line-strong hover:bg-mist",
                  )}
                >
                  <span className="sr-only">
                    Question {position + 1}, {done ? "répondue" : "sans réponse"}
                  </span>
                  <span aria-hidden>{position + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2.5 text-xs text-muted">
          Les questions sans réponse apparaissent en gris clair et sont annoncées comme telles.
        </p>
      </nav>
    </section>
  );
}
