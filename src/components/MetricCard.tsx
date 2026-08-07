import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cx, formatDelta } from "@/src/lib/format";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  /** Variation exprimée en points, affichée avec sa direction. */
  delta?: number;
  deltaSuffix?: string;
  icon?: ReactNode;
  accent?: boolean;
}

/** Bloc de chiffre clé, unité de base des deux tableaux de bord. */
export function MetricCard({
  label,
  value,
  unit,
  hint,
  delta,
  deltaSuffix = "pts / 30 j",
  icon,
  accent = false,
}: MetricCardProps) {
  const DeltaIcon = delta === undefined || delta === 0 ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaTone =
    delta === undefined || delta === 0
      ? "text-graphite"
      : delta > 0
        ? "text-positive"
        : "text-danger";

  return (
    <div
      className={cx(
        "flex h-full flex-col justify-between rounded-md border p-5",
        accent ? "border-brand/25 bg-brand-soft" : "border-line bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="nm-label">{label}</p>
        {icon ? <span className="shrink-0 text-brand">{icon}</span> : null}
      </div>

      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight tabular-nums text-ink">{value}</span>
        {unit ? <span className="text-sm font-medium text-graphite">{unit}</span> : null}
      </p>

      {delta !== undefined ? (
        <p className={cx("mt-3 flex items-center gap-1 text-sm font-medium", deltaTone)}>
          <DeltaIcon size={16} aria-hidden />
          <span className="tabular-nums">{formatDelta(delta)}</span>
          <span className="font-normal text-graphite">{deltaSuffix}</span>
        </p>
      ) : null}

      {hint ? <p className="mt-3 text-sm leading-snug text-graphite">{hint}</p> : null}
    </div>
  );
}
