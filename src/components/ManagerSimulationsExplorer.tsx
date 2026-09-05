"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { SessionSummary, SessionStatus } from "@/src/types";
import { SessionTable } from "@/src/components/SessionTable";
import { STATUS_LABELS, cx } from "@/src/lib/format";

type StatusFilter = "toutes" | SessionStatus;
type SortMode = "recent" | "score-desc" | "score-asc";

const STATUS_FILTERS: StatusFilter[] = ["toutes", "terminee", "en-analyse", "a-refaire"];

const SORT_LABELS: Record<SortMode, string> = {
  recent: "Plus récentes",
  "score-desc": "Meilleur score",
  "score-asc": "Score le plus faible",
};

/**
 * Explorateur des simulations de l'équipe.
 *
 * L'ancienne page se limitait à un simple tableau de trois lignes, sans
 * recherche ni filtre : illisible dès que l'équipe et l'historique
 * grandissent. Cet écran filtre par commercial, par statut, et trie par date
 * ou par score.
 */
export function ManagerSimulationsExplorer({ sessions }: { sessions: SessionSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("toutes");
  const [sort, setSort] = useState<SortMode>("recent");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = sessions;

    if (needle) {
      list = list.filter((session) =>
        `${session.repName ?? ""} ${session.title} ${session.objectiveLabel}`
          .toLowerCase()
          .includes(needle),
      );
    }

    if (status !== "toutes") {
      list = list.filter((session) => session.status === status);
    }

    const sorted = [...list];
    if (sort === "recent") {
      sorted.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
    } else if (sort === "score-desc") {
      sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    } else {
      sorted.sort((a, b) => (a.score ?? 101) - (b.score ?? 101));
    }

    return sorted;
  }, [sessions, query, status, sort]);

  const counts = useMemo(() => {
    const byStatus: Record<StatusFilter, number> = {
      toutes: sessions.length,
      terminee: 0,
      "en-analyse": 0,
      "a-refaire": 0,
    };
    for (const session of sessions) byStatus[session.status] += 1;
    return byStatus;
  }, [sessions]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un commercial, un objectif…"
            className="w-full rounded-sm border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-muted focus:border-brand-accent"
            aria-label="Rechercher une simulation"
          />
        </label>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortMode)}
          className="rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-brand-accent"
          aria-label="Trier les simulations"
        >
          {(Object.keys(SORT_LABELS) as SortMode[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrer par statut"
      >
        {STATUS_FILTERS.map((filter) => {
          const active = filter === status;
          const label = filter === "toutes" ? "Toutes" : STATUS_LABELS[filter];
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setStatus(filter)}
              aria-pressed={active}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active ? "bg-brand text-white" : "bg-line text-ink hover:bg-brand-sky hover:text-brand",
              )}
            >
              {label}
              <span className={cx("ml-1.5 tabular-nums", active ? "text-white/70" : "text-muted")}>
                {counts[filter]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-graphite">
          Aucune simulation ne correspond à ces critères.
        </p>
      ) : (
        <SessionTable sessions={filtered} showRep />
      )}
    </div>
  );
}
