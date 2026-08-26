import { cx, formatDelta, scoreColor } from "@/src/lib/format";

interface ScoreGaugeProps {
  score: number;
  /** Diamètre en pixels. */
  size?: number;
  label?: string;
  caption?: string;
  className?: string;
  /** « dark » pour un affichage sur fond marine. */
  tone?: "light" | "dark";
}

/**
 * Jauge circulaire de score global (0 à 100).
 * Rendue en SVG statique : aucun code client nécessaire.
 */
export function ScoreGauge({
  score,
  size = 176,
  label = "Score global",
  caption = "sur 100",
  className,
  tone = "light",
}: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = Math.max(8, Math.round(size * 0.075));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color = tone === "dark" ? "#ffffff" : scoreColor(clamped);
  const track = tone === "dark" ? "rgba(255,255,255,0.16)" : "#eff2f8";

  return (
    <figure className={cx("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${label} : ${clamped} sur 100`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={track}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-semibold leading-none tabular-nums tracking-tight"
            style={{ fontSize: size * 0.3, color }}
          >
            {clamped}
          </span>
          <span
            className={cx(
              "mt-1.5 text-xs font-medium",
              tone === "dark" ? "text-white/60" : "text-muted",
            )}
          >
            {caption}
          </span>
        </div>
      </div>
      {label ? (
        <figcaption
          className={cx("nm-label mt-4", tone === "dark" ? "text-brand-sky" : undefined)}
        >
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Petite barre de score horizontale, pour les listes de compétences. */
export function ScoreBar({
  score,
  label,
  delta,
  className,
}: {
  score: number;
  label: string;
  /** Variation en points depuis la simulation précédente, si connue. */
  delta?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium text-ink">{label}</span>
        <span className="flex shrink-0 items-baseline gap-2">
          {delta !== undefined && delta !== 0 ? (
            <span
              className={cx(
                "text-[11px] font-semibold tabular-nums",
                delta > 0 ? "text-positive" : "text-danger",
              )}
            >
              {formatDelta(delta)}
            </span>
          ) : null}
          <span className="text-sm font-semibold tabular-nums text-ink">{clamped}</span>
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mist"
        role="img"
        aria-label={`${label} : ${clamped} sur 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${clamped}%`, backgroundColor: scoreColor(clamped) }}
        />
      </div>
    </div>
  );
}
