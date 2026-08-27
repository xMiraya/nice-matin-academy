interface Props {
  readonly current: number;
  readonly total: number;
  readonly answered: number;
}

/** Indicateur de progression d'un questionnaire, annoncé aux lecteurs d'écran. */
export function ProgressIndicator({ current, total, answered }: Props) {
  const percent = total === 0 ? 0 : Math.round(((current + 1) / total) * 100);

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="nm-label">
          Question {current + 1} sur {total}
        </p>
        <p className="text-[13px] text-graphite">
          {answered} question{answered > 1 ? "s" : ""} répondue{answered > 1 ? "s" : ""} sur {total}
        </p>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Progression dans le questionnaire"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
