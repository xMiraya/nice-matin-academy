import Link from "next/link";
import { ChevronRight, TriangleAlert } from "lucide-react";
import type { PedagogicalAlert, TeamMember } from "@/src/types";
import { getCompetencyLabel } from "@/src/data/competencies";
import { cx, formatDelta, formatShortDate, scoreColor, scoreToneClasses } from "@/src/lib/format";
import { Avatar } from "@/src/components/Avatar";
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
    <ul className="space-y-1.5">
      {members.map((member) => {
        const focus = weakest(member);
        const name = `${member.profile.firstName} ${member.profile.lastName}`;
        const content = (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar initials={member.profile.initials} photo={member.profile.photo} size="md" />
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
              <span className="hidden w-40 md:block">
                <span className="nm-label block">À travailler</span>
                {focus ? (
                  <>
                    <span className="mt-1 block truncate text-xs font-medium text-graphite">
                      {getCompetencyLabel(focus.competencyId)}
                    </span>
                    <span
                      className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-line"
                      aria-hidden
                    >
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${focus.score}%`,
                          backgroundColor: scoreColor(focus.score),
                        }}
                      />
                    </span>
                  </>
                ) : (
                  <span className="mt-1 block truncate text-xs text-muted">Pas encore de donnée</span>
                )}
              </span>

              {member.sessionsCount > 0 ? (
                <span
                  className={cx(
                    "min-w-12 rounded-full px-2.5 py-1.5 text-center text-sm font-semibold tabular-nums",
                    scoreToneClasses(member.averageScore),
                  )}
                >
                  {member.averageScore}
                </span>
              ) : (
                <span className="min-w-12 text-center text-sm text-muted">n/a</span>
              )}
              <span
                className={cx(
                  "min-w-11 text-right text-sm font-semibold tabular-nums",
                  member.progress > 0
                    ? "text-positive"
                    : member.progress < 0
                      ? "text-danger"
                      : "text-muted",
                )}
                title="Progression sur trente jours"
              >
                {formatDelta(member.progress)}
              </span>
              {member.href ? (
                <ChevronRight size={16} className="text-muted" aria-hidden />
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
                className="flex items-center justify-between gap-4 rounded-md px-3 py-3 transition-colors hover:bg-brand-soft"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-md px-3 py-3 transition-colors hover:bg-mist">
                {content}
              </div>
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
  if (alerts.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-graphite">
        Aucun point d&apos;attention cette semaine : l&apos;équipe est régulière et progresse.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="rounded-md bg-mist/70 p-4 transition-colors hover:bg-mist"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ALERT_TONE[alert.level]} dot>
              {ALERT_LABEL[alert.level]}
            </Badge>
            {alert.repName ? (
              <span className="text-xs font-medium text-graphite">{alert.repName}</span>
            ) : null}
          </div>
          <p className="mt-2.5 text-sm font-semibold leading-snug text-ink">{alert.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-graphite">{alert.detail}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Encart compact « à relancer » : commerciaux sans simulation récente.
 *
 * La fenêtre est calée sur la dernière activité connue de l'équipe plutôt que
 * sur l'horloge du serveur : le rendu reste déterministe et la lecture garde
 * son sens même sur un jeu de données figé.
 */
export function InactiveMembers({
  members,
  sinceDays = 14,
}: {
  members: TeamMember[];
  sinceDays?: number;
}) {
  const timestamps = members
    .map((member) =>
      member.lastSessionDate ? Date.parse(`${member.lastSessionDate}T12:00:00`) : Number.NaN,
    )
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-graphite">
        Aucune simulation n&apos;a encore été enregistrée pour cette équipe.
      </p>
    );
  }

  const reference = Math.max(...timestamps);
  const threshold = reference - sinceDays * 24 * 60 * 60 * 1000;
  const inactive = members.filter((member) => {
    if (!member.lastSessionDate) return true;
    return Date.parse(`${member.lastSessionDate}T12:00:00`) < threshold;
  });

  if (inactive.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-graphite">
        Tous les commerciaux se sont entraînés dans les {sinceDays} jours précédant la dernière
        activité de l&apos;équipe.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {inactive.map((member) => (
        <li
          key={member.profile.id}
          className="flex items-center gap-3 rounded-md bg-warning-soft px-3 py-2.5"
        >
          <TriangleAlert size={15} className="shrink-0 text-warning" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {member.profile.firstName} {member.profile.lastName}
            </span>
            <span className="block text-xs text-graphite">
              {member.lastSessionDate
                ? `Dernière simulation le ${formatShortDate(member.lastSessionDate)}`
                : "Aucune simulation enregistrée"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
