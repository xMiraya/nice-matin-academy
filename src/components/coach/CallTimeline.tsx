import type { CoachKeyMoment, CoachMissedOpportunity } from "@/src/types/coach";
import { KEY_MOMENT_META } from "@/src/components/coach/CoachShared";
import { cx, formatTimer } from "@/src/lib/format";

interface CallTimelineProps {
  moments: CoachKeyMoment[];
  missed: CoachMissedOpportunity[];
  durationSeconds: number;
  className?: string;
}

/** Position d'un horodatage sur la durée totale, bornée pour rester dans le cadre. */
function positionOf(seconds: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, (seconds / duration) * 100));
}

/**
 * Chronologie de l'appel.
 *
 * Le compte rendu liste les moments clés, mais une liste ne montre pas
 * *quand* l'entretien a basculé ni à quelle distance les incidents se suivent.
 * Chaque repère est placé à son horodatage réel sur la durée de l'appel : rien
 * n'est inventé, seul le positionnement est calculé.
 */
export function CallTimeline({
  moments,
  missed,
  durationSeconds,
  className,
}: CallTimelineProps) {
  const ordered = [...moments].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  const locatedMissed = missed.filter(
    (item): item is CoachMissedOpportunity & { timestampSeconds: number } =>
      typeof item.timestampSeconds === "number",
  );

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    label: formatTimer(Math.round(durationSeconds * ratio)),
  }));

  return (
    <div className={className}>
      {/*
        Description textuelle équivalente : le schéma est décoratif pour un
        lecteur d'écran, la liste complète des moments suit dans la page.
      */}
      <div className="min-w-[520px] sm:min-w-0" aria-hidden>
        {/* Voie 1 — moments clés, étiquettes au-dessus du rail */}
        <div className="relative h-24">
          {ordered.map((moment, index) => {
            const meta = KEY_MOMENT_META[moment.type];
            const left = positionOf(moment.timestampSeconds, durationSeconds);
            // Les étiquettes alternent sur deux hauteurs pour ne pas se chevaucher.
            const high = index % 2 === 0;
            return (
              <div
                key={`m-${moment.timestampSeconds}-${index}`}
                className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${left}%` }}
              >
                <span
                  className={cx(
                    "max-w-[130px] truncate rounded-full px-2 py-1 text-[11px] font-semibold leading-none",
                    "bg-mist text-ink",
                  )}
                >
                  {moment.title}
                </span>
                <span className="mt-0.5 font-mono text-[10px] tabular-nums text-muted">
                  {formatTimer(moment.timestampSeconds)}
                </span>
                <span
                  className={cx("w-px bg-line", high ? "h-6" : "h-2")}
                  style={{ marginTop: 2 }}
                />
                <span className={cx("h-3 w-3 rounded-full ring-2 ring-white", meta.dot)} />
              </div>
            );
          })}
        </div>

        {/* Rail de la durée */}
        <div className="relative h-2 rounded-full bg-gradient-to-r from-brand-sky via-brand-accent to-brand">
          <span className="absolute inset-y-0 left-0 w-px bg-white/40" />
        </div>

        {/* Graduations */}
        <div className="relative mt-1.5 h-4">
          {ticks.map((tick) => (
            <span
              key={tick.ratio}
              className="absolute -translate-x-1/2 font-mono text-[10px] tabular-nums text-muted"
              style={{ left: `${tick.ratio * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>

        {/* Voie 2 — occasions manquées, sous le rail */}
        {locatedMissed.length > 0 ? (
          <div className="relative mt-3 h-14">
            {locatedMissed.map((item, index) => {
              const left = positionOf(item.timestampSeconds, durationSeconds);
              return (
                <div
                  key={`o-${item.timestampSeconds}-${index}`}
                  className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${left}%` }}
                >
                  <span className="h-3 w-3 rotate-45 border-2 border-dashed border-warning bg-warning-soft" />
                  <span className="mt-1 h-2 w-px bg-line" />
                  <span className="max-w-[140px] truncate rounded-full bg-warning-soft px-2 py-1 text-[11px] font-semibold leading-none text-warning">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Légende du schéma : rappelle ce que signifie chaque type de repère. */
export function CallTimelineLegend({ types }: { types: CoachKeyMoment["type"][] }) {
  const unique = [...new Set(types)];
  return (
    <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
      {unique.map((type) => {
        const meta = KEY_MOMENT_META[type];
        return (
          <li key={type} className="flex items-center gap-2 text-xs text-graphite">
            <span className={cx("h-2.5 w-2.5 rounded-full", meta.dot)} aria-hidden />
            {meta.label}
          </li>
        );
      })}
      <li className="flex items-center gap-2 text-xs text-graphite">
        <span
          className="h-2.5 w-2.5 rotate-45 border-2 border-dashed border-warning bg-warning-soft"
          aria-hidden
        />
        Occasion manquée
      </li>
    </ul>
  );
}
