import { cx } from "@/src/lib/format";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Couleur du tracé. Le dégradé de remplissage en est dérivé. */
  color?: string;
  className?: string;
  label?: string;
}

/**
 * Mini-courbe de tendance, rendue en SVG statique.
 *
 * Elle accompagne un chiffre clé : on ne cherche pas la valeur exacte mais la
 * direction. Aucune dépendance de graphique n'est chargée pour l'afficher.
 */
export function Sparkline({
  values,
  width = 160,
  height = 44,
  color = "#0a4aab",
  className,
  label,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const padding = 4;
  const usable = height - padding * 2;

  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = padding + usable - ((value - min) / span) * usable;
    return [x, y] as const;
  });

  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const gradientId = `nm-spark-${color.replace("#", "")}`;
  const last = points.at(-1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cx("h-11 w-full", className)}
      role={label ? "img" : "presentation"}
      aria-label={label}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last ? <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} /> : null}
    </svg>
  );
}
