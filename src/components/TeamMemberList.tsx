import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PedagogicalAlert, TeamMember } from "@/src/types";
import { getCompetencyLabel } from "@/src/data/competencies";
import { cx, formatDelta, formatShortDate, scoreToneClasses } from "@/src/lib/format";
import { Badge } from "@/src/components/StatusBadge";

/** Compétence la plus fragile d'un commercial, utilisée comme axe d'accompagnement. */
function weakest(member: TeamMember) {
  return [...member.competencyScores].sort((a, b) => a.score - b.score)[0];
}

/**
 * Liste des commerciaux, orientée accompagnement : aucun classement de type
 * sanction, mais un niveau, une progression et une priorité pédagogique.
 */
export function TeamMemberList({ members }: { members: TeamMember[] }) {
  return (
    <ul className="divide-y divide-line">
      {members.map((member) => {
        const focus = weakest(member);
        const name = `${member.profile.firstName} ${member.profile.lastName}`;
        const content = (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-ink text-xs font-semibold text-white">
                {member.profile.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{name}</span>
                <span className="block truncate text-xs text-graphite">
                  {member.profile.team} · {member.sessionsCount} simulations ·{" "}
                  {member.lastSessionDate
                    ? `dernière le ${formatShortDate(member.lastSessionDate)}`
                    : "aucune simulation"}
                </span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <span className="hidden text-right md:block">
                <span className="nm-label block">Priorité</span>
                <span className="mt-0.5 block text-xs text-graphite">
                  {getCompetencyLabel(focus.competencyId)}
                </span>
              </span>
              <span
                className={cx(
                  "min-w-14 rounded-sm px-2 py-1.5 text-center text-sm font-semibold tabular-nums",
                  scoreToneClasses(member.averageScore),
                )}
              >
                {member.averageScore}
              </span>
              <span
                className={cx(
                  "min-w-12 text-right text-sm font-semibold tabular-nums",
                  member.progress > 0
                    ? "text-positive"
                    : member.progress < 0
                      ? "text-danger"
                      : "text-graphite",
                )}
                title="Progression sur trente jours"
              >
                {formatDelta(member.progress)}
              </span>
              {member.href ? (
                <ChevronRight size={16} className="text-graphite" aria-hidden />
              ) : (
                <span className="w-4" aria-hidden />
              )}
            </div>
          </>
        );

        return (
          <li key={member.profile.id}>
            {member.href ? (
              <Link
                href={member.href}
                className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-mist/60"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-4 py-3.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const ALERT_TONE = {
  priorite: "critique",
  vigilance: "vigilance",
  information: "information",
} as const;

const ALERT_LABEL = {
  priorite: "Priorité pédagogique",
  vigilance: "Accompagnement",
  information: "Information",
} as const;

/** Alertes pédagogiques, formulées comme des propositions d'accompagnement. */
export function PedagogicalAlerts({ alerts }: { alerts: PedagogicalAlert[] }) {
  return (
    <ul className="space-y-4">
      {alerts.map((alert) => (
        <li key={alert.id} className="rounded-md border border-line p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ALERT_TONE[alert.level]}>{ALERT_LABEL[alert.level]}</Badge>
            {alert.repName ? <span className="text-xs text-graphite">{alert.repName}</span> : null}
          </div>
          <p className="mt-2.5 text-sm font-semibold leading-snug text-ink">{alert.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-graphite">{alert.detail}</p>
        </li>
      ))}
    </ul>
  );
}
