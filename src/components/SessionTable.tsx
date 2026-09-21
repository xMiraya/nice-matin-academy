import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SessionSummary } from "@/src/types";
import { StatusBadge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";
import { Avatar } from "@/src/components/Avatar";
import { photoForName } from "@/src/data/team-photos";
import {
  DIFFICULTY_LABELS,
  cx,
  formatDuration,
  formatShortDate,
  scoreToneClasses,
} from "@/src/lib/format";

interface SessionTableProps {
  sessions: SessionSummary[];
  /** Affiche la colonne « Commercial » dans la vue manager. */
  showRep?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Initiales d'un nom complet, pour la pastille d'identité. */
function initialsOf(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ScoreCell({ session }: { session: SessionSummary }) {
  if (session.score === null) {
    return <span className="text-sm text-muted">—</span>;
  }
  return (
    <span
      className={cx(
        "inline-flex min-w-11 justify-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums",
        scoreToneClasses(session.score),
      )}
    >
      {session.score}
    </span>
  );
}

const HEAD_CLASS = "pb-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted";

/** Tableau des simulations, avec repli en cartes sur mobile. */
export function SessionTable({
  sessions,
  showRep = false,
  emptyTitle = "Aucune simulation pour le moment",
  emptyDescription = "Les comptes rendus apparaîtront ici dès la première simulation terminée.",
}: SessionTableProps) {
  if (sessions.length === 0) {
    return <EmptyState
        image="/images/etats/aucune-simulation.jpg"
        title={emptyTitle}
        description={emptyDescription}
      />;
  }

  return (
    <>
      {/* Tableau — tablette et ordinateur */}
      <div className="-mx-2 hidden overflow-x-auto px-2 md:block">
        <table className="w-full min-w-[700px] border-separate border-spacing-y-1 text-left text-sm">
          <thead>
            <tr>
              <th scope="col" className={cx(HEAD_CLASS, "pl-3")}>
                Simulation
              </th>
              {showRep ? (
                <th scope="col" className={HEAD_CLASS}>
                  Commercial
                </th>
              ) : null}
              <th scope="col" className={HEAD_CLASS}>
                Date
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Niveau
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Durée
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Score
              </th>
              <th scope="col" className={HEAD_CLASS}>
                Statut
              </th>
              <th scope="col" className={cx(HEAD_CLASS, "pr-3")}>
                <span className="sr-only">Compte rendu</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                key={session.id}
                className="bg-mist/60 transition-colors hover:bg-brand-soft"
              >
                <td className="rounded-l-md py-3 pl-3 pr-4">
                  <span className="block font-semibold text-ink">{session.title}</span>
                  <span className="mt-0.5 block text-xs text-graphite">
                    {session.objectiveLabel}
                    {session.technicalTest ? " (test technique, hors statistiques)" : ""}
                  </span>
                </td>
                {showRep ? (
                  <td className="py-3 pr-4">
                    {session.repName ? (
                      <span className="flex items-center gap-2">
                        <Avatar
                          initials={initialsOf(session.repName)}
                          photo={photoForName(session.repName)}
                          size="xs"
                        />
                        <span className="text-graphite">{session.repName}</span>
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                ) : null}
                <td className="py-3 pr-4 tabular-nums text-graphite">
                  {formatShortDate(session.date)}
                </td>
                <td className="py-3 pr-4 text-graphite">{DIFFICULTY_LABELS[session.difficulty]}</td>
                <td className="py-3 pr-4 tabular-nums text-graphite">
                  {formatDuration(session.durationSeconds)}
                </td>
                <td className="py-3 pr-4">
                  <ScoreCell session={session} />
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={session.status} />
                </td>
                <td className="rounded-r-md py-3 pr-3 text-right">
                  {session.href ? (
                    <Link
                      href={session.href}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand hover:text-brand-accent"
                    >
                      Compte rendu
                      <ChevronRight size={15} aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">Non disponible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes — mobile */}
      <ul className="space-y-2.5 md:hidden">
        {sessions.map((session) => (
          <li key={session.id} className="rounded-md bg-mist/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold leading-snug text-ink">{session.title}</p>
                <p className="mt-1 text-xs text-graphite">
                  {session.objectiveLabel} · {DIFFICULTY_LABELS[session.difficulty]}
                </p>
              </div>
              <ScoreCell session={session} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-graphite">
              <span className="tabular-nums">{formatShortDate(session.date)}</span>
              <span className="tabular-nums">{formatDuration(session.durationSeconds)}</span>
              {showRep && session.repName ? <span>{session.repName}</span> : null}
              <StatusBadge status={session.status} />
            </div>
            {session.href ? (
              <Link
                href={session.href}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand"
              >
                Compte rendu
                <ChevronRight size={15} aria-hidden />
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
