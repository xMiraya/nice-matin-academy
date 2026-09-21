"use client";

import { PageLoading } from "@/src/components/PageLoading";
import { EmptyState } from "@/src/components/EmptyState";
import { useManagerDashboard } from "@/src/lib/team/use-manager-dashboard";
import { teamCompetencyAverages } from "@/src/lib/team/team-insights";
import { getCompetency } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { SkillsHeatmap } from "@/src/components/SkillsHeatmap";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { CompetencyLeaderRow } from "@/src/components/CompetencyLeaderRow";
import { TeamSpotlight } from "@/src/components/TeamSpotlight";
import { Badge } from "@/src/components/StatusBadge";
import { cx } from "@/src/lib/format";

/** Rotation de trois teintes de la charte, pour distinguer les cartes sans sortir du ton général. */
const PRIORITY_ACCENTS = [
  "border-brand-sky bg-brand-soft",
  "border-info/25 bg-info-soft",
  "border-line-strong bg-mist",
] as const;

export function ManagerCompetencesScreen() {
  const { dashboard } = useManagerDashboard();
  if (!dashboard) return <PageLoading />;

  const members = dashboard.members.filter((member) => member.sessionsCount > 0);
  if (members.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Espace manager"
          title="Compétences de l'équipe"
          description="Moyennes calculées sur l'ensemble des commerciaux."
        />
        <EmptyState
          image="/images/etats/aucun-resultat.jpg"
          title="Aucune simulation analysée pour le moment"
          description="Les niveaux par compétence apparaîtront dès qu'un commercial aura terminé une simulation avec Julie."
        />
      </>
    );
  }

  const teamScores = teamCompetencyAverages(members);

  const sorted = [...teamScores].sort((a, b) => a.score - b.score);
  const toStrengthen = sorted.filter((score) => score.score < 60);

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Compétences de l'équipe"
        description="Moyennes calculées sur les commerciaux ayant réalisé au moins une simulation."
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
          description="Carte thermique complète : recherchez, triez une colonne."
        >
          <SkillsHeatmap members={members} />
        </Panel>
      </div>
    </>
  );
}
