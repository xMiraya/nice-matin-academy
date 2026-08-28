"use client";

import { Check, ChevronDown, Minus, X } from "lucide-react";
import { Correction } from "@/src/components/qcm/Correction";
import { cx } from "@/src/lib/format";
import type { Question, QuestionOutcome, QuestionResult } from "@/src/types/qcm/quiz";

const OUTCOME_META: Record<
  QuestionOutcome,
  { label: string; chip: string; dot: string; icon: typeof Check }
> = {
  correct: {
    label: "Correct",
    chip: "border-positive-bright/40 bg-positive-soft text-positive",
    dot: "bg-positive-bright",
    icon: Check,
  },
  partial: {
    label: "Partiel",
    chip: "border-warning-bright/50 bg-warning-soft text-warning",
    dot: "bg-warning-bright",
    icon: Minus,
  },
  incorrect: {
    label: "À revoir",
    chip: "border-danger-bright/35 bg-danger-soft text-danger",
    dot: "bg-danger-bright",
    icon: X,
  },
  unanswered: {
    label: "Sans réponse",
    chip: "border-line-strong bg-mist text-graphite",
    dot: "bg-line-strong",
    icon: Minus,
  },
};

interface TrainingRecapProps {
  readonly questions: readonly Question[];
  readonly results: readonly QuestionResult[];
}

/**
 * Récapitulatif visuel d'une série d'entraînement.
 *
 * On montre d'abord la forme d'ensemble, puis la correction complète de chaque
 * question : réponse donnée, réponse attendue, commentaire de chaque option et
 * conseil de terrain. Les questions ratées sont ouvertes d'office.
 */
export function TrainingRecap({ questions, results }: TrainingRecapProps) {
  const total = results.length;
  const counts = {
    correct: results.filter((r) => r.outcome === "correct").length,
    partial: results.filter((r) => r.outcome === "partial").length,
    incorrect: results.filter((r) => r.outcome === "incorrect").length,
    unanswered: results.filter((r) => r.outcome === "unanswered").length,
  };
  const percent = total === 0 ? 0 : Math.round((counts.correct / total) * 100);
  const toReview = results
    .map((result, index) => ({ result, index, question: questions[index] }))
    .filter((row) => row.result.outcome !== "correct" && row.question);

  const ringColor =
    percent >= 80
      ? "var(--color-positive-bright)"
      : percent >= 50
        ? "var(--color-brand-accent)"
        : "var(--color-warning-bright)";

  return (
    <div className="space-y-5">
      {/* Score et répartition */}
      <div className="flex flex-wrap items-center gap-6">
        <div
          className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${ringColor} ${percent * 3.6}deg, var(--color-line) 0deg)`,
          }}
          role="img"
          aria-label={`${counts.correct} réponses entièrement correctes sur ${total}`}
        >
          <div className="flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full bg-white">
            <span className="nm-display text-2xl tabular-nums text-ink">
              {counts.correct}
              <span className="text-base text-muted">/{total}</span>
            </span>
            <span className="text-[11px] font-semibold text-muted">{percent} %</span>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2">
          {(["correct", "partial", "incorrect", "unanswered"] as const)
            .filter((key) => counts[key] > 0)
            .map((key) => {
              const meta = OUTCOME_META[key];
              return (
                <li
                  key={key}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold",
                    meta.chip,
                  )}
                >
                  <span aria-hidden className={cx("h-2 w-2 rounded-full", meta.dot)} />
                  {counts[key]} {meta.label.toLowerCase()}
                </li>
              );
            })}
        </ul>
      </div>

      {/* Pastilles question par question */}
      <div>
        <p className="nm-label mb-2.5">Question par question</p>
        <ol className="flex flex-wrap gap-1.5">
          {results.map((result, index) => {
            const meta = OUTCOME_META[result.outcome];
            const Icon = meta.icon;
            return (
              <li
                key={result.questionId}
                className={cx(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-sm border",
                  meta.chip,
                )}
                title={`Question ${index + 1} — ${meta.label}`}
              >
                <span className="sr-only">
                  Question {index + 1} : {meta.label}
                </span>
                <Icon size={13} strokeWidth={3} aria-hidden />
                <span aria-hidden className="text-[10px] font-semibold tabular-nums">
                  {index + 1}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Correction complète de la série, question par question */}
      <div>
        <p className="nm-label mb-1">Correction de la série</p>
        <p className="mb-2.5 text-[13px] leading-relaxed text-graphite">
          Les questions à reprendre sont ouvertes d’office. Les réponses correctes se déplient si
          vous voulez relire pourquoi elles l’étaient.
        </p>
        <ul className="space-y-2">
          {results.map((result, index) => {
            const question = questions[index];
            if (!question) return null;
            const meta = OUTCOME_META[result.outcome];
            const Icon = meta.icon;
            return (
              <li key={result.questionId}>
                <details
                  open={result.outcome !== "correct"}
                  className="group rounded-sm border border-line bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 rounded-sm p-3.5 transition-colors hover:bg-mist">
                    <span
                      aria-hidden
                      className={cx(
                        "flex h-6 w-6 shrink-0 items-center justify-center gap-0.5 rounded-xs border text-[11px] font-semibold tabular-nums",
                        meta.chip,
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span
                          className={cx(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            meta.chip,
                          )}
                        >
                          <Icon size={11} strokeWidth={3} aria-hidden />
                          {meta.label}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-[13px] font-medium leading-snug text-ink">
                        {question.prompt}
                      </span>
                    </span>
                    <ChevronDown
                      size={17}
                      aria-hidden
                      className="mt-0.5 shrink-0 text-muted transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="px-3.5 pb-3.5">
                    {question.scenario ? (
                      <p className="mt-1 rounded-sm border border-warning-bright/40 bg-warning-soft p-3.5 text-sm leading-relaxed text-ink">
                        {question.scenario}
                      </p>
                    ) : null}
                    <Correction question={question} result={result} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </div>

      {toReview.length === 0 ? (
        <p className="rounded-sm border border-positive-bright/30 bg-positive-soft p-4 text-sm text-ink">
          Toutes les réponses sont entièrement correctes. Rien à reprendre sur cette série.
        </p>
      ) : null}
    </div>
  );
}
