import Link from "next/link";
import type { TeamMember } from "@/src/types";
import { COMPETENCIES } from "@/src/data/competencies";
import { cx } from "@/src/lib/format";

/** Aplat de couleur en fonction du niveau, du plus fragile au plus solide. */
function cellClasses(score: number): string {
  if (score >= 75) return "bg-positive/85 text-white";
  if (score >= 65) return "bg-positive/45 text-ink";
  if (score >= 55) return "bg-warning/30 text-ink";
  if (score >= 45) return "bg-warning/55 text-ink";
  return "bg-danger/60 text-white";
}

const LEGEND = [
  { label: "À travailler", className: "bg-danger/60" },
  { label: "En construction", className: "bg-warning/55" },
  { label: "En progression", className: "bg-warning/30" },
  { label: "Acquis", className: "bg-positive/45" },
  { label: "Solide", className: "bg-positive/85" },
];

/** Carte thermique commerciaux × compétences. */
export function SkillsHeatmap({ members }: { members: TeamMember[] }) {
  return (
    <div>
      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[760px] border-separate border-spacing-0.5 text-sm">
          <caption className="sr-only">
            Niveau de chaque commercial sur les huit compétences, de 0 à 100
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-44 px-2 pb-2 text-left align-bottom">
                <span className="nm-label">Commercial</span>
              </th>
              {COMPETENCIES.map((competency) => (
                <th key={competency.id} scope="col" className="px-1 pb-2 align-bottom">
                  <span className="block text-[11px] font-medium leading-tight text-graphite">
                    {competency.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const byId = new Map(member.competencyScores.map((s) => [s.competencyId, s.score]));
              const name = `${member.profile.firstName} ${member.profile.lastName}`;
              return (
                <tr key={member.profile.id}>
                  <th scope="row" className="px-2 py-1 text-left align-middle">
                    {member.href ? (
                      <Link
                        href={member.href}
                        className="text-sm font-medium text-ink underline-offset-2 hover:text-brand hover:underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-ink">{name}</span>
                    )}
                  </th>
                  {COMPETENCIES.map((competency) => {
                    const score = byId.get(competency.id) ?? 0;
                    return (
                      <td key={competency.id} className="p-0">
                        <span
                          className={cx(
                            "flex h-10 items-center justify-center rounded-sm text-xs font-semibold tabular-nums",
                            cellClasses(score),
                          )}
                          title={`${name} — ${competency.label} : ${score} sur 100`}
                        >
                          {score}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-graphite">
            <span className={cx("h-3 w-3 rounded-sm", item.className)} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
