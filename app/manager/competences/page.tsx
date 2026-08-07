import type { Metadata } from "next";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { COMPETENCIES, getCompetency } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { SkillsHeatmap } from "@/src/components/SkillsHeatmap";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ScoreBar } from "@/src/components/ScoreGauge";
import { Badge } from "@/src/components/StatusBadge";

export const metadata: Metadata = {
  title: "Compétences",
  description: "Niveau de l'équipe sur les huit compétences commerciales.",
};

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Profil moyen de l'équipe" className="lg:col-span-2">
          <CompetencyRadar scores={teamScores} seriesLabel="Moyenne d'équipe" />
        </Panel>

        <Panel
          title="Détail par compétence"
          description="Du niveau le plus fragile au plus solide."
          className="lg:col-span-3"
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {sorted.map((score) => (
              <ScoreBar
                key={score.competencyId}
                score={score.score}
                label={getCompetency(score.competencyId).label}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
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
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {toStrengthen.map((score) => {
                const competency = getCompetency(score.competencyId);
                return (
                  <li key={score.competencyId} className="rounded-md border border-brand/25 bg-brand-soft p-4">
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

      <div className="mt-6">
        <Panel title="Commerciaux × compétences">
          <SkillsHeatmap members={members} />
        </Panel>
      </div>
    </>
  );
}
