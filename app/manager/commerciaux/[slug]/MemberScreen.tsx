"use client";

import { Award, CalendarCheck, Gauge, Target } from "lucide-react";
import type { CoachPriority, CompetencyId } from "@/src/types";
import { getCompetencyLabel } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { PageLoading } from "@/src/components/PageLoading";
import { EmptyState } from "@/src/components/EmptyState";
import { MetricCard } from "@/src/components/MetricCard";
import { Badge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ProgressChart } from "@/src/components/charts/ProgressChart";
import { SessionTable } from "@/src/components/SessionTable";
import { CoachPriorityCard } from "@/src/components/CoachPriorityCard";
import { ScoreBar } from "@/src/components/ScoreGauge";
import { useManagerDashboard } from "@/src/lib/team/use-manager-dashboard";
import { reportsOf, teamCompetencyAverages } from "@/src/lib/team/team-insights";
import { computeReportInsights } from "@/src/lib/reports/report-insights";
import { useReports } from "@/src/lib/reports/use-reports";

const LEVEL_LABELS = {
  debutant: "Niveau débutant",
  intermediaire: "Niveau intermédiaire",
  confirme: "Niveau confirmé",
} as const;

/** Fiche de suivi individuelle d'un commercial, calculée sur ses simulations réelles. */
export function MemberScreen({ slug }: { slug: string }) {
  const { dashboard } = useManagerDashboard();
  const allReports = useReports();
  if (!dashboard) return <PageLoading />;

  const member = dashboard.members.find((entry) => entry.profile.slug === slug);
  if (!member) {
    return (
      <>
        <PageHeader
          eyebrow="Fiche commercial"
          title="Commercial introuvable"
          back={{ href: "/manager/commerciaux", label: "Commerciaux" }}
        />
        <EmptyState
          image="/images/etats/aucun-resultat.jpg"
          title="Ce commercial n'existe pas ou n'est plus actif"
          description="Retournez à la liste pour choisir un autre profil."
          action={
            <ButtonLink href="/manager/commerciaux" variant="secondary">
              Retour aux commerciaux
            </ButtonLink>
          }
        />
      </>
    );
  }

  const { profile } = member;
  const reports = reportsOf(allReports, profile);
  const insights = computeReportInsights(reports, "/manager/simulations");
  const teamAverages = teamCompetencyAverages(dashboard.members);

  const header = (
    <PageHeader
      eyebrow="Fiche commercial"
      title={`${profile.firstName} ${profile.lastName}`}
      description="Suivi individuel : niveau actuel, évolution et axes d'accompagnement proposés."
      back={{ href: "/manager/commerciaux", label: "Commerciaux" }}
      meta={
        <>
          <Badge tone="marque">{profile.role}</Badge>
          <Badge>{profile.team}</Badge>
          {profile.level ? <Badge>{LEVEL_LABELS[profile.level]}</Badge> : null}
        </>
      }
    />
  );

  if (!insights.hasReports) {
    return (
      <>
        {header}
        <EmptyState
          image="/images/etats/aucune-simulation.jpg"
          title="Aucune simulation pour le moment"
          description={`${profile.firstName} n'a pas encore terminé de simulation. Sa fiche se remplira dès le premier compte rendu.`}
        />
      </>
    );
  }

  const sorted = [...insights.competencyAverages].sort((a, b) => b.score - a.score);
  const strong = sorted.slice(0, 3);
  const fragile = [...sorted].reverse().slice(0, 3);

  const latest = [...reports].sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0];
  const nextFocus: CoachPriority = {
    title: latest.pedagogicalPriority.label,
    diagnostic: latest.pedagogicalPriority.reason,
    action: latest.nextActions[0]?.instruction ?? "Reprendre cette compétence lors de la prochaine simulation.",
    competencyId: latest.pedagogicalPriority.competencyId as CompetencyId,
  };

  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Score moyen"
          value={insights.averageScore ?? 0}
          unit="/ 100"
          icon={<Gauge size={18} aria-hidden />}
          delta={member.progress || undefined}
        />
        <MetricCard
          label="Simulations terminées"
          value={insights.count}
          icon={<CalendarCheck size={18} aria-hidden />}
        />
        <MetricCard
          label="Compétence solide"
          value={strong[0].score}
          unit="/ 100"
          icon={<Award size={18} aria-hidden />}
          hint={getCompetencyLabel(strong[0].competencyId)}
          tone="positif"
        />
        <MetricCard
          label="Priorité d'accompagnement"
          value={fragile[0].score}
          unit="/ 100"
          icon={<Target size={18} aria-hidden />}
          hint={getCompetencyLabel(fragile[0].competencyId)}
          tone="vigilance"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Panel
          title="Profil de compétences"
          description="Comparaison avec la moyenne d'équipe."
          className="lg:col-span-3"
        >
          <CompetencyRadar
            scores={insights.competencyAverages}
            seriesLabel={profile.firstName}
            comparison={{ label: "Moyenne d'équipe", scores: teamAverages }}
          />
        </Panel>

        <Panel title="Évolution" description="Score de chaque simulation." className="lg:col-span-2">
          <ProgressChart data={insights.scoreHistory} />
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Compétences solides" description="Points d'appui à valoriser en entretien.">
          <div className="space-y-4">
            {strong.map((score) => (
              <ScoreBar
                key={score.competencyId}
                score={score.score}
                label={getCompetencyLabel(score.competencyId)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Compétences à accompagner" description="Axes de progression prioritaires.">
          <div className="space-y-4">
            {fragile.map((score) => (
              <ScoreBar
                key={score.competencyId}
                score={score.score}
                label={getCompetencyLabel(score.competencyId)}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-5">
        <CoachPriorityCard priority={nextFocus} accent />
      </div>

      <div className="mt-5">
        <Panel title="Historique des simulations" description="Ouvrez un compte rendu pour le lire et le commenter.">
          <SessionTable sessions={insights.sessions} />
        </Panel>
      </div>
    </>
  );
}
