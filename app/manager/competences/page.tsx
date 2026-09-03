import type { Metadata } from "next";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { COMPETENCIES, getCompetency } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { SkillsHeatmap } from "@/src/components/SkillsHeatmap";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { CompetencyLeaderRow } from "@/src/components/CompetencyLeaderRow";
import { TeamSpotlight } from "@/src/components/TeamSpotlight";
import { Badge } from "@/src/components/StatusBadge";
import { cx } from "@/src/lib/format";

export const metadata: Metadata = {
  title: "Compétences",
  description: "Niveau de l'équipe sur les huit compétences commerciales.",
};

/** Rotation de trois teintes de la charte, pour distinguer les cartes sans sortir du ton général. */
const PRIORITY_ACCENTS = [
  "border-brand-sky bg-brand-soft",
  "border-info/25 bg-info-soft",
  "border-line-strong bg-mist",
] as const;

export default function ManagerCompetencesPage() {
  const members = DEMO_MANAGER_DASHBOARD.members;

  const teamScores = COMPETENCIES.map((competency) => {
    const total = members.reduce((sum, member) => {
      const score = member.competencyScores.find((s) => s.competencyId === competency.id);
      return sum + (score?.score ?? 0);
    }, 0);
    return {
      competencyId: competency.id,
      score: Math.round(total / members.length),
    };
  });

  const sorted = [...teamScores].sort((a, b) => a.score - b.score);
  const toStrengthen = sorted.filter((score) => score.score < 60);

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Compétences de l'équipe"
        description="Moyennes calculées sur l'ensemble des commerciaux, hors appels de validation technique."
      />

      {/* Qui porte l'équipe, qui a le plus besoin d'accompagnement — vue d'ensemble avant le détail. */}
      <div className="mb-5">
        <TeamSpotlight members={members} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Panel title="Profil moyen de l'équipe" className="lg:col-span-2">
          <CompetencyRadar scores={teamScores} seriesLabel="Moyenne d'équipe" />
        </Panel>

        <Panel
          title="Détail par compétence"
          description="Du niveau le plus fragile au plus solide, avec qui la tire vers le haut ou vers le bas."
          className="lg:col-span-3"
        >
          <div className="space-y-3">
            {sorted.map((score) => (
              <CompetencyLeaderRow
                key={score.competencyId}
                competencyId={score.competencyId}
                label={getCompetency(score.competencyId).label}
                teamScore={score.score}
                members={members}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-5">
        <Panel
          title="Priorités pédagogiques"
          description="Compétences dont la moyenne d'équipe reste sous 60."
        >
          {toStrengthen.length === 0 ? (
            <p className="text-sm text-graphite">
              Toutes les compétences dépassent 60 de moyenne. Le dispositif peut se concentrer sur la
              consolidation.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {toStrengthen.map((score, index) => {
                const competency = getCompetency(score.competencyId);
                return (
                  <li
                    key={score.competencyId}
                    className={cx(
                      "rounded-md border p-4",
                      PRIORITY_ACCENTS[index % PRIORITY_ACCENTS.length],
                    )}
                  >
                    <Badge tone="marque">{score.score} / 100</Badge>
                    <p className="mt-3 text-sm font-semibold text-ink">{competency.label}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                      {competency.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5">
        <Panel
          title="Commerciaux × compétences"
          description="Carte thermique complète — recherchez, triez une colonne."
        >
          <SkillsHeatmap members={members} />
        </Panel>
      </div>
    </>
  );
}
