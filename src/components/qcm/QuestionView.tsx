"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cx } from "@/src/lib/format";
import type { AnswerValue, Question } from "@/src/types/qcm/quiz";

interface Props {
  readonly question: Question;
  readonly value: AnswerValue;
  readonly onChange: (value: AnswerValue) => void;
  /** Verrouille les champs une fois la correction affichée (mode entraînement). */
  readonly locked?: boolean;
  readonly index: number;
  readonly total: number;
}

const KIND_LABEL: Record<Question["kind"], string> = {
  single: "Une seule bonne réponse",
  multiple: "Plusieurs bonnes réponses",
  "true-false": "Vrai ou faux, avec justification",
  ordering: "Remise en ordre",
};

export function QuestionView({ question, value, onChange, locked = false, index, total }: Props) {
  return (
    <fieldset className="nm-card p-5 sm:p-6" disabled={locked}>
      <legend className="sr-only">
        Question {index + 1} sur {total}
      </legend>

      <p className="nm-label">
        Question {index + 1} / {total} · {KIND_LABEL[question.kind]}
      </p>

      {question.scenario ? (
        <p className="mt-3.5 max-w-prose whitespace-pre-line rounded-sm border border-warning-bright/40 bg-warning-soft p-3.5 text-sm leading-relaxed text-ink">
          {question.scenario}
        </p>
      ) : null}

      <h2 className="mt-3.5 max-w-prose whitespace-pre-line text-lg font-semibold leading-snug tracking-tight text-ink">
        {question.prompt}
      </h2>

      {question.kind === "ordering" ? (
        <OrderingInput question={question} value={value} onChange={onChange} locked={locked} />
      ) : (
        <ChoiceInput question={question} value={value} onChange={onChange} />
      )}
    </fieldset>
  );
}

function ChoiceInput({
  question,
  value,
  onChange,
}: {
  question: Extract<Question, { kind: "single" | "multiple" | "true-false" }>;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  const multiple = question.kind === "multiple";

  function toggle(optionId: string) {
    if (!multiple) {
      onChange([optionId]);
      return;
    }
    onChange(
      value.includes(optionId) ? value.filter((id) => id !== optionId) : [...value, optionId],
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {question.options.map((option) => {
        const checked = value.includes(option.id);
        const inputId = `${question.id}-${option.id}`;
        return (
          <li key={option.id}>
            <label
              htmlFor={inputId}
              className={cx(
                "flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border p-3.5 text-sm leading-relaxed transition-colors",
                checked
                  ? "border-brand-accent bg-brand-soft text-ink"
                  : "border-line bg-white text-graphite hover:border-line-strong hover:bg-mist",
              )}
            >
              <input
                id={inputId}
                type={multiple ? "checkbox" : "radio"}
                name={question.id}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#001a64]"
                checked={checked}
                onChange={() => toggle(option.id)}
              />
              <span>{option.label}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

const ARROW_CLASS =
  "flex h-11 w-11 items-center justify-center rounded-sm border border-line bg-white text-graphite transition-colors hover:border-line-strong hover:bg-mist hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Classement accessible : chaque étape porte deux boutons « monter » et
 * « descendre ». Aucune interaction de glisser-déposer n'est requise.
 */
function OrderingInput({
  question,
  value,
  onChange,
  locked,
}: {
  question: Extract<Question, { kind: "ordering" }>;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  locked: boolean;
}) {
  const order =
    value.length === question.steps.length ? [...value] : question.steps.map((s) => s.id);
  const labelOf = (id: string) => question.steps.find((s) => s.id === id)?.label ?? id;

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const a = next[from] as string;
    const b = next[to] as string;
    next[from] = b;
    next[to] = a;
    onChange(next);
  }

  return (
    <>
      <p className="mt-3.5 text-sm leading-relaxed text-graphite">
        Utilisez les boutons « Monter » et « Descendre » pour classer les étapes de la première à la
        dernière.
      </p>
      <ol className="mt-4 space-y-2">
        {order.map((stepId, position) => (
          <li
            key={stepId}
            className="flex min-h-11 items-center gap-3 rounded-sm border border-line bg-mist/60 p-3 text-sm"
          >
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold tabular-nums text-white"
            >
              {position + 1}
            </span>
            <span className="flex-1 leading-relaxed text-ink">
              <span className="sr-only">Position {position + 1} : </span>
              {labelOf(stepId)}
            </span>
            <span className="flex shrink-0 gap-1">
              <button
                type="button"
                className={ARROW_CLASS}
                onClick={() => move(position, position - 1)}
                disabled={locked || position === 0}
              >
                <ArrowUp size={16} aria-hidden />
                <span className="sr-only">Monter : {labelOf(stepId)}</span>
              </button>
              <button
                type="button"
                className={ARROW_CLASS}
                onClick={() => move(position, position + 1)}
                disabled={locked || position === order.length - 1}
              >
                <ArrowDown size={16} aria-hidden />
                <span className="sr-only">Descendre : {labelOf(stepId)}</span>
              </button>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
