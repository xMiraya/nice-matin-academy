import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cx, formatDelta } from "@/src/lib/format";

export type MetricTone = "neutre" | "marque" | "ciel" | "positif" | "vigilance";

interface ToneStyle {
  card: string;
  icon: string;
  label: string;
  value: string;
  hint: string;
}

const TONES: Record<MetricTone, ToneStyle> = {
  neutre: {
    card: "nm-card",
    icon: "bg-mist text-brand",
    label: "text-graphite",
    value: "text-ink",
    hint: "text-graphite",
  },
  ciel: {
    card: "rounded-lg border border-brand-sky bg-brand-soft",
    icon: "bg-white text-brand",
    label: "text-brand-mid",
    value: "text-brand",
    hint: "text-brand-mid",
  },
  marque: {
    card: "nm-navy rounded-lg shadow-lift",
    icon: "bg-white/12 text-brand-sky",
    label: "text-brand-sky",
    value: "text-white",
    hint: "text-white/65",
  },
  positif: {
    card: "rounded-lg border border-positive-bright/30 bg-positive-soft",
    icon: "bg-white text-positive",
    label: "text-positive",
    value: "text-ink",
    hint: "text-graphite",
  },
  vigilance: {
    card: "rounded-lg border border-warning-bright/45 bg-warning-soft",
    icon: "bg-white text-warning",
    label: "text-warning",
    value: "text-ink",
    hint: "text-graphite",
  },
};

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  /** Variation exprimée en points, affichée avec sa direction. */
  delta?: number;
  deltaSuffix?: string;
  icon?: ReactNode;
  tone?: MetricTone;
  /** Raccourci historique équivalent à `tone="ciel"`. */
  accent?: boolean;
  /** Contenu libre en pied de carte (mini-courbe, jauge, liste courte). */
  footer?: ReactNode;
  className?: string;
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
  tone,
  accent = false,
  footer,
  className,
}: MetricCardProps) {
  const resolved: MetricTone = tone ?? (accent ? "ciel" : "neutre");
  const style = TONES[resolved];
  const dark = resolved === "marque";

  const DeltaIcon =
    delta === undefined || delta === 0 ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;

  const deltaTone = dark
    ? "bg-white/12 text-white"
    : delta === undefined || delta === 0
      ? "bg-mist text-graphite"
      : delta > 0
        ? "bg-positive-soft text-positive"
        : "bg-danger-soft text-danger";

  return (
    <div className={cx("flex h-full flex-col p-5", style.card, className)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cx("text-sm font-medium leading-snug", style.label)}>{label}</span>
        {icon ? (
          <span
            className={cx(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-sm",
              style.icon,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>

      <p className="mt-4 flex items-baseline gap-1.5">
        <span
          className={cx(
            "text-[2.125rem] font-semibold leading-none tracking-tight tabular-nums",
            style.value,
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className={cx("text-sm font-medium", dark ? "text-white/60" : "text-muted")}>
            {unit}
          </span>
        ) : null}
      </p>

      {delta !== undefined ? (
        <p className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cx(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              deltaTone,
            )}
          >
            <DeltaIcon size={13} aria-hidden />
            {formatDelta(delta)}
          </span>
          <span className={cx("text-xs", style.hint)}>{deltaSuffix}</span>
        </p>
      ) : null}

      {hint ? (
        <p className={cx("mt-3 text-sm leading-snug", style.hint)}>{hint}</p>
      ) : null}

      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </div>
  );
}
