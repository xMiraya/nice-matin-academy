import { getCompetency } from "@/src/data/qcm/competencies";
import { Badge, type BadgeTone } from "@/src/components/StatusBadge";
import { cx } from "@/src/lib/format";
import type { AnswerValue, Question, QuestionResult } from "@/src/types/qcm/quiz";

const OUTCOME: Record<
  QuestionResult["outcome"],
  { label: string; tone: BadgeTone; surface: string }
> = {
  correct: {
    label: "Réponse correcte",
    tone: "positif",
    surface: "border-positive-bright/30 bg-positive-soft",
  },
  partial: {
    label: "Réponse partiellement correcte",
    tone: "vigilance",
    surface: "border-warning-bright/40 bg-warning-soft",
  },
  incorrect: {
    label: "Réponse incorrecte",
    tone: "critique",
    surface: "border-danger-bright/25 bg-danger-soft",
  },
  unanswered: {
    label: "Question sans réponse",
    tone: "neutre",
    surface: "border-line bg-mist",
  },
};

interface Props {
  readonly question: Question;
  readonly result: QuestionResult;
}

/**
 * Correction pédagogique. Elle n'affiche jamais un simple « bonne réponse » :
 * chaque option est commentée, la compétence est nommée, et un conseil de
 * terrain est fourni.
 */
export function Correction({ question, result }: Props) {
  const outcome = OUTCOME[result.outcome];
  const competency = getCompetency(question.competency);

  return (
    <section className={cx("mt-4 rounded-lg border p-5", outcome.surface)} aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="nm-label">Correction · {competency.label}</p>
        <Badge tone={outcome.tone} dot>
          {outcome.label}
        </Badge>
      </div>

      {question.kind === "ordering" ? (
        <OrderingCorrection question={question} given={result.given} />
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {question.options.map((option) => {
            const chosen = result.given.includes(option.id);
            return (
              <li
                key={option.id}
                className={cx(
                  "rounded-sm border bg-white/70 p-3.5",
                  option.correct ? "border-positive-bright/30" : "border-line",
                )}
              >
                <p className="flex flex-wrap items-center gap-2">
                  <Badge tone={option.correct ? "positif" : "neutre"}>
                    {option.correct ? "À retenir" : "Moins adapté"}
                  </Badge>
                  {chosen ? <Badge tone="information">Votre réponse</Badge> : null}
                </p>
                <p className="mt-2 font-medium leading-relaxed text-ink">{option.label}</p>
                <p className="mt-1 leading-relaxed text-graphite">{option.rationale}</p>
              </li>
            );
          })}
        </ul>
      )}

      {/*
        « Pourquoi » et « Sur le terrain » sont posés côte à côte : en une seule
        colonne étroite, la moitié droite du bloc de correction restait vide.
      */}
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <p className="rounded-sm bg-white/60 p-3.5 leading-relaxed text-graphite">
          <span className="font-semibold text-ink">Pourquoi : </span>
          {question.explanation}
        </p>
        <p className="rounded-sm bg-white/60 p-3.5 leading-relaxed text-graphite">
          <span className="font-semibold text-ink">Sur le terrain : </span>
          {question.fieldTip}
        </p>
      </div>
      <p className="mt-3 text-xs text-muted">Source : {question.source}</p>
    </section>
  );
}

function OrderingCorrection({
  question,
  given,
}: {
  question: Extract<Question, { kind: "ordering" }>;
  given: AnswerValue;
}) {
  const labelOf = (id: string) => question.steps.find((s) => s.id === id)?.label ?? id;

  return (
    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
      <div className="rounded-sm border border-line bg-white/70 p-3.5">
        <p className="nm-label">Ordre attendu</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed text-graphite">
          {question.correctOrder.map((id) => (
            <li key={id}>{labelOf(id)}</li>
          ))}
        </ol>
      </div>
      <div className="rounded-sm border border-line bg-white/70 p-3.5">
        <p className="nm-label">Votre classement</p>
        {given.length === 0 ? (
          <p className="mt-2 leading-relaxed text-graphite">Aucun classement enregistré.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed text-graphite">
            {given.map((id, position) => {
              const placed = question.correctOrder[position] === id;
              return (
                <li key={id} className={placed ? undefined : "text-danger"}>
                  {labelOf(id)}
                  {placed ? "" : " — position à revoir"}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
