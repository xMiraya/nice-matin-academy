"use client";

import { useState } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import { Correction } from "@/src/components/qcm/Correction";
import { getCompetency } from "@/src/data/qcm/competencies";
import { cx } from "@/src/lib/format";
import type { Question, QuestionOutcome, QuestionResult } from "@/src/types/qcm/quiz";

const OUTCOME_META: Record<
  QuestionOutcome,
  { label: string; chip: string; border: string; icon: typeof Check }
> = {
  correct: {
    label: "Correct",
    chip: "border-positive-bright/40 bg-positive-soft text-positive",
    border: "border-l-positive-bright",
    icon: Check,
  },
  partial: {
    label: "Partiel",
    chip: "border-warning-bright/50 bg-warning-soft text-warning",
    border: "border-l-warning-bright",
    icon: Minus,
  },
  incorrect: {
    label: "À revoir",
    chip: "border-danger-bright/35 bg-danger-soft text-danger",
    border: "border-l-danger-bright",
    icon: X,
  },
  unanswered: {
    label: "Sans réponse",
    chip: "border-line-strong bg-mist text-graphite",
    border: "border-l-line-strong",
    icon: Minus,
  },
};

type Filter = "tout" | "revoir" | "correct";

interface AssessmentCorrectionsProps {
  readonly questions: readonly Question[];
  readonly results: readonly QuestionResult[];
}

/**
 * Correction d'une évaluation, présentée en cartes repliées.
 *
 * Le détail complet reste disponible, mais il ne s'impose plus : on voit
 * d'abord la forme d'ensemble, on ouvre ensuite ce qu'on veut relire.
 */
export function AssessmentCorrections({ questions, results }: AssessmentCorrectionsProps) {
  const [filter, setFilter] = useState<Filter>("revoir");

  const rows = questions
    .map((question, position) => ({
      question,
      position,
      result: results.find((r) => r.questionId === question.id),
    }))
    .filter((row): row is { question: Question; position: number; result: QuestionResult } =>
      Boolean(row.result),
    );

  const toReview = rows.filter((row) => row.result.outcome !== "correct");
  const correct = rows.filter((row) => row.result.outcome === "correct");

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: "revoir", label: "À revoir", count: toReview.length },
    { id: "correct", label: "Correctes", count: correct.length },
    { id: "tout", label: "Toutes", count: rows.length },
  ];

  const shown =
    filter === "revoir" ? toReview : filter === "correct" ? correct : rows;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer la correction">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={cx(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
              filter === item.id
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-graphite hover:border-line-strong hover:bg-mist",
            )}
          >
            {item.label}
            <span
              className={cx(
                "rounded-full px-1.5 text-[11px] tabular-nums",
                filter === item.id ? "bg-white/20" : "bg-mist",
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-mist/60 p-6 text-center text-sm text-graphite">
          {filter === "revoir"
            ? "Aucune question à revoir : toutes vos réponses sont correctes."
            : "Aucune question dans cette catégorie."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map(({ question, position, result }) => {
            const meta = OUTCOME_META[result.outcome];
            const Icon = meta.icon;
            return (
              <li key={question.id} className="flex">
                <details
                  className={cx(
                    "nm-card group w-full overflow-hidden border-l-4",
                    meta.border,
                  )}
                >
                  <summary className="flex cursor-pointer list-none gap-3.5 p-4 transition-colors hover:bg-mist sm:p-5">
                    <span
                      aria-hidden
                      className={cx(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border",
                        meta.chip,
                      )}
                    >
                      <Icon size={14} strokeWidth={3} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="nm-label">Question {position + 1}</span>
                        <span
                          className={cx(
                            "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            meta.chip,
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted">
                          {getCompetency(question.competency).shortLabel}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-sm font-medium leading-snug text-ink">
                        {question.prompt}
                      </span>
                    </span>

                    <ChevronDown
                      size={18}
                      aria-hidden
                      className="mt-1 shrink-0 text-muted transition-transform group-open:rotate-180"
                    />
                  </summary>

                  <div className="border-t border-line px-4 pb-4 sm:px-5 sm:pb-5">
                    {question.scenario ? (
                      <p className="mt-4 rounded-sm border border-warning-bright/40 bg-warning-soft p-3.5 text-sm leading-relaxed text-ink">
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
      )}
    </div>
  );
}
