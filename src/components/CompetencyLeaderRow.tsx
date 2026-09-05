import Link from "next/link";
import type { CompetencyId, TeamMember } from "@/src/types";
import { Avatar } from "@/src/components/Avatar";
import { cx, scoreColor } from "@/src/lib/format";

interface CompetencyLeaderRowProps {
  label: string;
  competencyId: CompetencyId;
  teamScore: number;
  members: TeamMember[];
}

/**
 * Ligne de détail d'une compétence : la moyenne d'équipe, et qui la tire vers
 * le haut ou vers le bas.
 *
 * Le score moyen seul ne dit pas grand-chose au manager : « 58 » ne suggère
 * aucune action. Savoir que c'est Sofia qui maîtrise le mieux ce point, et que
 * Claire est celle qui en a le plus besoin, transforme le chiffre en deux
 * personnes à qui parler.
 */
export function CompetencyLeaderRow({
  label,
  competencyId,
  teamScore,
  members,
}: CompetencyLeaderRowProps) {
  const scored = members
    .map((member) => ({
      member,
      score: member.competencyScores.find((s) => s.competencyId === competencyId)?.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const worst = scored.at(-1);
  const showBoth = best && worst && best.member.profile.id !== worst.member.profile.id;

  return (
    <div className="rounded-md bg-mist/60 p-4 transition-colors hover:bg-mist">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-ink">{teamScore}</span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${label} : moyenne d'équipe ${teamScore} sur 100`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${teamScore}%`, backgroundColor: scoreColor(teamScore) }}
        />
      </div>

      {best ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/70 pt-3">
          <LeaderChip label="Meilleur niveau" entry={best} tone="best" />
          {showBoth ? <LeaderChip label="À accompagner" entry={worst} tone="watch" /> : null}
        </div>
      ) : null}
    </div>
  );
}

function LeaderChip({
  label,
  entry,
  tone,
}: {
  label: string;
  entry: { member: TeamMember; score: number };
  tone: "best" | "watch";
}) {
  const name = `${entry.member.profile.firstName} ${entry.member.profile.lastName}`;
  const badge =
    tone === "best" ? "bg-positive-soft text-positive" : "bg-warning-soft text-warning";

  const inner = (
    <span className="flex items-center gap-2">
      <Avatar initials={entry.member.profile.initials} photo={entry.member.profile.photo} size="xs" />
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="truncate text-xs font-semibold text-ink">{name}</span>
          <span className={cx("rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums", badge)}>
            {entry.score}
          </span>
        </span>
      </span>
    </span>
  );

  return entry.member.href ? (
    <Link href={entry.member.href} className="rounded-sm transition-opacity hover:opacity-75">
      {inner}
    </Link>
  ) : (
    inner
  );
}
