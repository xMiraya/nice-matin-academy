"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, Search } from "lucide-react";
import type { CompetencyId, TeamMember } from "@/src/types";
import { COMPETENCIES } from "@/src/data/competencies";
import { cx } from "@/src/lib/format";
import { Avatar } from "@/src/components/Avatar";

/** Aplat de couleur en fonction du niveau, du plus fragile au plus solide. */
function cellClasses(score: number): string {
  if (score >= 75) return "bg-positive-bright text-white";
  if (score >= 65) return "bg-positive-bright/30 text-ink";
  if (score >= 55) return "bg-warning-bright/25 text-ink";
  if (score >= 45) return "bg-warning-bright/60 text-ink";
  return "bg-danger-bright/85 text-white";
}

const LEGEND = [
  { label: "À travailler", className: "bg-danger-bright/85" },
  { label: "En construction", className: "bg-warning-bright/60" },
  { label: "En progression", className: "bg-warning-bright/25" },
  { label: "Acquis", className: "bg-positive-bright/30" },
  { label: "Solide", className: "bg-positive-bright" },
];

type SortKey = "name" | CompetencyId | "average";

/** Nombre de lignes visibles avant de proposer « Afficher tout ». */
const INITIAL_ROWS = 8;

/**
 * En-tête de colonne triable.
 *
 * Déclaré hors du composant : un composant défini à l'intérieur du corps de
 * `SkillsHeatmap` serait recréé à chaque rendu, perdant tout état interne à
 * chaque frappe dans la recherche.
 */
function SortHeader({
  label,
  sortableKey,
  activeKey,
  direction,
  onToggle,
}: {
  label: string;
  sortableKey: SortKey;
  activeKey: SortKey;
  direction: "asc" | "desc";
  onToggle: (key: SortKey) => void;
}) {
  const active = activeKey === sortableKey;
  return (
    <button
      type="button"
      onClick={() => onToggle(sortableKey)}
      className={cx(
        "flex items-center gap-1 text-[11px] font-medium leading-tight transition-colors",
        active ? "text-brand" : "text-graphite hover:text-ink",
      )}
      aria-label={`Trier par ${label}`}
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp size={11} aria-hidden />
        ) : (
          <ArrowDown size={11} aria-hidden />
        )
      ) : null}
    </button>
  );
}

/**
 * Carte thermique commerciaux × compétences.
 *
 * Lisible telle quelle pour une petite équipe, mais un tableau de cinquante
 * lignes sans recherche ni tri devient un mur de chiffres. La recherche filtre
 * par nom, un clic sur une colonne trie dessus, et seules les premières lignes
 * sont montrées par défaut au-delà d'un certain effectif.
 */
export function SkillsHeatmap({ members }: { members: TeamMember[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("average");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState(false);

  const withAverage = useMemo(
    () =>
      members.map((member) => {
        const total = member.competencyScores.reduce((sum, s) => sum + s.score, 0);
        const average = member.competencyScores.length
          ? Math.round(total / member.competencyScores.length)
          : 0;
        return { member, average };
      }),
    [members],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return withAverage;
    return withAverage.filter(({ member }) =>
      `${member.profile.firstName} ${member.profile.lastName} ${member.profile.team}`
        .toLowerCase()
        .includes(needle),
    );
  }, [withAverage, query]);

  const sorted = useMemo(() => {
    const scoreOf = (entry: (typeof withAverage)[number]): number => {
      if (sortKey === "average") return entry.average;
      return entry.member.competencyScores.find((s) => s.competencyId === sortKey)?.score ?? 0;
    };
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortKey === "name") {
        const nameA = `${a.member.profile.firstName} ${a.member.profile.lastName}`;
        const nameB = `${b.member.profile.firstName} ${b.member.profile.lastName}`;
        return sortDir === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      const diff = scoreOf(a) - scoreOf(b);
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const scalesUp = members.length > INITIAL_ROWS;
  const visible = expanded || !scalesUp ? sorted : sorted.slice(0, INITIAL_ROWS);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div>
      {members.length > 5 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un commercial ou une équipe…"
              className="w-full rounded-sm border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-muted focus:border-brand-accent"
              aria-label="Rechercher un commercial"
            />
          </label>
          <span className="text-xs text-muted">
            {sorted.length} commercial{sorted.length > 1 ? "aux" : ""}
            {query ? ` sur ${members.length}` : ""}
          </span>
        </div>
      ) : null}

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-graphite">
          Aucun commercial ne correspond à « {query} ».
        </p>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <table className="w-full min-w-[760px] border-separate border-spacing-1 text-sm">
            <caption className="sr-only">
              Niveau de chaque commercial sur les huit compétences, de 0 à 100
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-44 px-2 pb-2 text-left align-bottom">
                  <SortHeader
                    label="Commercial"
                    sortableKey="name"
                    activeKey={sortKey}
                    direction={sortDir}
                    onToggle={toggleSort}
                  />
                </th>
                {COMPETENCIES.map((competency) => (
                  <th key={competency.id} scope="col" className="px-1 pb-2 align-bottom text-center">
                    <SortHeader
                      label={competency.label}
                      sortableKey={competency.id}
                      activeKey={sortKey}
                      direction={sortDir}
                      onToggle={toggleSort}
                    />
                  </th>
                ))}
                <th scope="col" className="px-1 pb-2 align-bottom text-center">
                  <SortHeader
                    label="Moyenne"
                    sortableKey="average"
                    activeKey={sortKey}
                    direction={sortDir}
                    onToggle={toggleSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ member, average }) => {
                const byId = new Map(member.competencyScores.map((s) => [s.competencyId, s.score]));
                const name = `${member.profile.firstName} ${member.profile.lastName}`;
                return (
                  <tr key={member.profile.id} className="group">
                    <th scope="row" className="px-2 py-1 text-left align-middle">
                      {member.href ? (
                        <Link
                          href={member.href}
                          className="flex items-center gap-2 rounded-sm py-1 pr-2 text-sm font-semibold text-ink transition-colors hover:text-brand"
                        >
                          <Avatar initials={member.profile.initials} photo={member.profile.photo} size="xs" />
                          <span className="truncate">{name}</span>
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 py-1 text-sm font-medium text-ink">
                          <Avatar initials={member.profile.initials} photo={member.profile.photo} size="xs" />
                          <span className="truncate">{name}</span>
                        </span>
                      )}
                    </th>
                    {COMPETENCIES.map((competency) => {
                      const score = byId.get(competency.id) ?? 0;
                      return (
                        <td key={competency.id} className="p-0">
                          <span
                            className={cx(
                              "flex h-10 items-center justify-center rounded-xs text-xs font-semibold tabular-nums",
                              cellClasses(score),
                            )}
                            title={`${name}, ${competency.label} : ${score} sur 100`}
                          >
                            {score}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-0">
                      <span
                        className={cx(
                          "flex h-10 items-center justify-center rounded-xs text-xs font-bold tabular-nums ring-1 ring-inset ring-brand-sky",
                          cellClasses(average),
                        )}
                        title={`${name}, moyenne : ${average} sur 100`}
                      >
                        {average}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {scalesUp && !expanded && sorted.length > INITIAL_ROWS ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-sm bg-brand-soft py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-sky"
        >
          Afficher les {sorted.length - INITIAL_ROWS} autres commerciaux
          <ChevronDown size={15} aria-hidden />
        </button>
      ) : null}

      <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-graphite">
            <span className={cx("h-3 w-3 rounded-xs", item.className)} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
