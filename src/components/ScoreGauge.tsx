import { cx, scoreColor } from "@/src/lib/format";

interface ScoreGaugeProps {
  score: number;
  /** Diamètre en pixels. */
  size?: number;
  label?: string;
  caption?: string;
  className?: string;
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
}: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = Math.max(8, Math.round(size * 0.07));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const color = scoreColor(clamped);

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
            stroke="#f4f4f5"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="butt"
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
          <span className="mt-1.5 text-xs font-medium text-graphite">{caption}</span>
        </div>
      </div>
      {label ? <figcaption className="nm-label mt-4">{label}</figcaption> : null}
    </figure>
  );
}

/** Petite barre de score horizontale, pour les listes de compétences. */
export function ScoreBar({ score, label }: { score: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-graphite">{clamped}</span>
      </div>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mist"
        role="img"
        aria-label={`${label} : ${clamped} sur 100`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: scoreColor(clamped) }}
        />
      </div>
    </div>
  );
}
