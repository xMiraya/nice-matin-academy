import type { ReactNode } from "react";
import type { SessionStatus } from "@/src/types";
import { STATUS_LABELS, cx } from "@/src/lib/format";

export type BadgeTone = "neutre" | "positif" | "vigilance" | "critique" | "information" | "marque";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutre: "bg-mist text-graphite border-line",
  positif: "bg-positive-soft text-positive border-positive-bright/25",
  vigilance: "bg-warning-soft text-warning border-warning-bright/40",
  critique: "bg-danger-soft text-danger border-danger-bright/25",
  information: "bg-info-soft text-info border-info/20",
  marque: "bg-brand-soft text-brand border-brand-sky",
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  neutre: "bg-muted",
  positif: "bg-positive-bright",
  vigilance: "bg-warning-bright",
  critique: "bg-danger-bright",
  information: "bg-info",
  marque: "bg-brand",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  /** Ajoute une pastille de couleur devant le libellé. */
  dot?: boolean;
  className?: string;
}

/** Étiquette compacte réutilisée partout (statuts, mentions, niveaux). */
export function Badge({ tone = "neutre", children, icon, dot = false, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot ? (
        <span aria-hidden className={cx("h-1.5 w-1.5 rounded-full", DOT_CLASSES[tone])} />
      ) : null}
      {icon}
      {children}
    </span>
  );
}

const STATUS_TONES: Record<SessionStatus, BadgeTone> = {
  terminee: "positif",
  "en-analyse": "information",
  "a-refaire": "vigilance",
};

/** Badge de statut d'une simulation : terminée, en analyse, à refaire. */
export function StatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status]} dot className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** Mention systématique des appels de validation technique. */
export function TechnicalTestBadge({ className }: { className?: string }) {
  return (
    <Badge tone="vigilance" className={className}>
      Test technique : exclu des statistiques
    </Badge>
  );
}

/** Mention explicite des éléments non connectés à un service réel. */
export function DemoBadge({
  children = "Démonstration",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Badge tone="neutre" className={className}>
      {children}
    </Badge>
  );
}
