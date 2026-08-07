import type { ReactNode } from "react";
import type { SessionStatus } from "@/src/types";
import { STATUS_LABELS, cx } from "@/src/lib/format";

export type BadgeTone = "neutre" | "positif" | "vigilance" | "critique" | "information" | "marque";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutre: "bg-mist text-graphite border-line",
  positif: "bg-positive/10 text-positive border-positive/25",
  vigilance: "bg-warning/12 text-[#8a5900] border-warning/35",
  critique: "bg-danger/10 text-danger border-danger/25",
  information: "bg-info/10 text-info border-info/25",
  marque: "bg-brand-soft text-brand-dark border-brand/25",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Étiquette compacte réutilisée partout (statuts, mentions, niveaux). */
export function Badge({ tone = "neutre", children, icon, className }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]",
        TONE_CLASSES[tone],
        className,
      )}
    >
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
    <Badge tone={STATUS_TONES[status]} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** Mention systématique des appels de validation technique. */
export function TechnicalTestBadge({ className }: { className?: string }) {
  return (
    <Badge tone="vigilance" className={className}>
      Test technique — exclu des statistiques
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
