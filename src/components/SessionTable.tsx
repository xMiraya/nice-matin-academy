import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SessionSummary } from "@/src/types";
import { StatusBadge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";
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

function ScoreCell({ session }: { session: SessionSummary }) {
  if (session.score === null) {
    return <span className="text-sm text-graphite">—</span>;
  }
  return (
    <span
      className={cx(
        "inline-flex min-w-11 justify-center rounded-sm px-2 py-1 text-sm font-semibold tabular-nums",
        scoreToneClasses(session.score),
      )}
    >
      {session.score}
    </span>
  );
}

/** Tableau élégant des simulations, avec repli en cartes sur mobile. */
export function SessionTable({
  sessions,
  showRep = false,
  emptyTitle = "Aucune simulation pour le moment",
  emptyDescription = "Les comptes rendus apparaîtront ici dès la première simulation terminée.",
}: SessionTableProps) {
  if (sessions.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Tableau — tablette et ordinateur */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-4 font-semibold text-graphite">
                Simulation
              </th>
              {showRep ? (
                <th scope="col" className="py-2 pr-4 font-semibold text-graphite">
                  Commercial
                </th>
              ) : null}
              <th scope="col" className="py-2 pr-4 font-semibold text-graphite">
                Date
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold text-graphite">
                Niveau
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold text-graphite">
                Durée
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold text-graphite">
                Score
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold text-graphite">
                Statut
              </th>
              <th scope="col" className="py-2 font-semibold text-graphite">
                <span className="sr-only">Compte rendu</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b border-line/70 last:border-0">
                <td className="py-3 pr-4">
                  <span className="block font-medium text-ink">{session.title}</span>
                  <span className="mt-0.5 block text-xs text-graphite">
                    {session.objectiveLabel}
                    {session.technicalTest ? " — test technique, hors statistiques" : ""}
                  </span>
                </td>
                {showRep ? (
                  <td className="py-3 pr-4 text-graphite">{session.repName ?? "—"}</td>
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
                <td className="py-3 text-right">
                  {session.href ? (
                    <Link
                      href={session.href}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark"
                    >
                      Compte rendu
                      <ChevronRight size={15} aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-xs text-graphite">Démonstration</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes — mobile */}
      <ul className="space-y-3 md:hidden">
        {sessions.map((session) => (
          <li key={session.id} className="rounded-md border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium leading-snug text-ink">{session.title}</p>
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
