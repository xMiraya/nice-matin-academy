import Link from "next/link";
import { Award, TrendingDown, TrendingUp } from "lucide-react";
import type { TeamMember } from "@/src/types";
import { getCompetencyLabel } from "@/src/data/competencies";
import { Avatar } from "@/src/components/Avatar";
import { cx, formatDelta } from "@/src/lib/format";

/** Compétence la plus solide et la plus fragile d'un commercial donné. */
function extremes(member: TeamMember) {
  const sorted = [...member.competencyScores].sort((a, b) => b.score - a.score);
  return { best: sorted[0], worst: sorted.at(-1) };
}

interface SpotlightCardProps {
  title: string;
  member: TeamMember;
  tone: "best" | "watch";
}

/** Carte « à la une » : un commercial mis en avant, avec sa compétence forte ou fragile. */
function SpotlightCard({ title, member, tone }: SpotlightCardProps) {
  const name = `${member.profile.firstName} ${member.profile.lastName}`;
  const { best, worst } = extremes(member);
  const highlighted = tone === "best" ? best : worst;
  const Icon = tone === "best" ? Award : TrendingDown;

  const surface =
    tone === "best"
      ? "border border-brand-sky bg-gradient-to-br from-brand-soft via-white to-white"
      : "border border-warning-bright/35 bg-gradient-to-br from-warning-soft via-white to-white";

  const iconSurface = tone === "best" ? "bg-brand text-white" : "bg-warning-bright text-ink";

  const content = (
    <div className={cx("relative flex h-full flex-col overflow-hidden rounded-lg p-5", surface)}>
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl",
          tone === "best" ? "bg-brand-accent/15" : "bg-warning-bright/20",
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="nm-label">{title}</span>
        <span className={cx("flex h-8 w-8 items-center justify-center rounded-full", iconSurface)}>
          <Icon size={15} aria-hidden />
        </span>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <Avatar initials={member.profile.initials} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-graphite">{member.profile.team}</p>
        </div>
      </div>

      <div className="relative mt-4 flex items-baseline gap-2">
        <span className="nm-display text-3xl text-ink">{member.averageScore}</span>
        <span className="text-sm text-muted">/ 100 en moyenne</span>
        <span
          className={cx(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            member.progress > 0
              ? "bg-positive-soft text-positive"
              : member.progress < 0
                ? "bg-danger-soft text-danger"
                : "bg-mist text-graphite",
          )}
        >
          <TrendingUp size={12} aria-hidden />
          {formatDelta(member.progress)}
        </span>
      </div>

      {highlighted ? (
        <div className="relative mt-4 border-t border-line/70 pt-3">
          <p className="text-xs text-graphite">
            {tone === "best" ? "Sa compétence la plus solide" : "Sa compétence la plus fragile"}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">
              {getCompetencyLabel(highlighted.competencyId)}
            </span>
            <span className="text-sm font-bold tabular-nums text-ink">{highlighted.score}</span>
          </div>
        </div>
      ) : null}
    </div>
  );

  return member.href ? (
    <Link href={member.href} className="group block h-full transition-transform hover:-translate-y-0.5">
      {content}
    </Link>
  ) : (
    content
  );
}

/**
 * Mise en avant des deux profils extrêmes de l'équipe : le meilleur score
 * moyen et celui qui a le plus besoin d'accompagnement. Sert de point
 * d'entrée visuel avant le détail exhaustif compétence par compétence.
 */
export function TeamSpotlight({ members }: { members: TeamMember[] }) {
  if (members.length < 2) return null;

  const sorted = [...members].sort((a, b) => b.averageScore - a.averageScore);
  const best = sorted[0];
  const watch = sorted.at(-1)!;

  if (best.profile.id === watch.profile.id) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <SpotlightCard title="Meilleur score d'équipe" member={best} tone="best" />
      <SpotlightCard title="Accompagnement prioritaire" member={watch} tone="watch" />
    </div>
  );
}
