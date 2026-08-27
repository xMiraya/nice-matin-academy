import { getCompetency } from "@/src/data/qcm/competencies";
import { cx } from "@/src/lib/format";
import type { CompetencyScore } from "@/src/types/qcm/quiz";

/**
 * Barres horizontales des huit compétences.
 * L'information n'est jamais portée par la seule couleur : chaque barre est
 * accompagnée de son pourcentage et d'un libellé de niveau en texte.
 */
export function CompetencyChart({ scores }: { readonly scores: readonly CompetencyScore[] }) {
  const shown = scores.filter((s) => s.questionCount > 0);

  if (shown.length === 0) {
    return <p className="text-sm text-graphite">Aucune compétence évaluée pour le moment.</p>;
  }

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Résultat par compétence, en pourcentage</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Compétence</th>
          <th scope="col">Score</th>
          <th scope="col">Niveau</th>
        </tr>
      </thead>
      <tbody>
        {shown.map((score) => {
          const percent = Math.round(score.ratio * 100);
          const competency = getCompetency(score.competency);
          const level =
            percent >= 80 ? "maîtrisé" : percent >= 65 ? "opérationnel" : "à retravailler";
          return (
            <tr key={score.competency} className="align-middle">
              <th
                scope="row"
                className="w-1/3 py-2 pr-4 text-left text-[13px] font-medium text-ink"
              >
                {competency.shortLabel}
              </th>
              <td className="py-2">
                <span aria-hidden className="block h-2.5 w-full overflow-hidden rounded-full bg-line">
                  <span
                    className={cx(
                      "block h-full rounded-full",
                      percent >= 80
                        ? "bg-positive-bright"
                        : percent >= 65
                          ? "bg-brand-accent"
                          : "bg-warning-bright",
                    )}
                    style={{ width: `${Math.max(percent, 2)}%` }}
                  />
                </span>
              </td>
              <td className="w-32 py-2 pl-4 text-right tabular-nums text-ink">
                {percent} %<span className="block text-[11px] text-muted">{level}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
