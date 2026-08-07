import Link from "next/link";
import { Target } from "lucide-react";
import type { CoachPriority } from "@/src/types";
import { getCompetencyLabel } from "@/src/data/competencies";
import { CoachMascot } from "@/src/components/coach/CoachMascot";
import { cx } from "@/src/lib/format";

interface CoachPriorityCardProps {
  priority: CoachPriority;
  /** Numéro d'ordre affiché à gauche, si la carte fait partie d'une liste. */
  index?: number;
  accent?: boolean;
  actionHref?: string;
  actionLabel?: string;
  /** Affiche la mascotte du Coach en petit format, en tête de carte. */
  showMascot?: boolean;
}

/** Recommandation du Coach IA : diagnostic puis action concrète. */
export function CoachPriorityCard({
  priority,
  index,
  accent = false,
  actionHref,
  actionLabel = "Commencer une simulation",
  showMascot = false,
}: CoachPriorityCardProps) {
  return (
    <article
      className={cx(
        "flex h-full flex-col rounded-md border p-5",
        accent ? "border-brand/30 bg-brand-soft" : "border-line bg-white",
      )}
    >
      <div className="flex items-center gap-2.5">
        {showMascot ? (
          <CoachMascot size="sm" />
        ) : index !== undefined ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-ink text-xs font-semibold tabular-nums text-white">
            {index}
          </span>
        ) : (
          <Target size={16} className="text-brand" aria-hidden />
        )}
        <span className="nm-label">{getCompetencyLabel(priority.competencyId)}</span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight text-ink">
        {priority.title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-graphite">{priority.diagnostic}</p>

      <div className="mt-4 border-t border-line/80 pt-4">
        <p className="nm-label">Action proposée</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">{priority.action}</p>
      </div>

      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-sm bg-ink px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-graphite"
        >
          {actionLabel}
        </Link>
      ) : null}
    </article>
  );
}
