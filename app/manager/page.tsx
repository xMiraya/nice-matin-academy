import type { Metadata } from "next";
import { Activity, CalendarCheck, Gauge, Target, TrendingUp, Users } from "lucide-react";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { Badge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { SkillsHeatmap } from "@/src/components/SkillsHeatmap";
import { SessionTable } from "@/src/components/SessionTable";
import { PedagogicalAlerts, TeamMemberList } from "@/src/components/TeamMemberList";
import { RealReportsPanel } from "@/src/components/coach/RealReportsPanel";
import { CoachMascot } from "@/src/components/coach/CoachMascot";
import { DemoBadge } from "@/src/components/StatusBadge";
import {
  ScoreDistributionChart,
  WeeklyEvolutionChart,
} from "@/src/components/charts/ProgressChart";

export const metadata: Metadata = {
  title: "Vue équipe",
  description: "Tableau de bord de la direction commerciale.",
};

export default function ManagerDashboardPage() {
  const data = DEMO_MANAGER_DASHBOARD;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title={`Bonjour ${data.profile.firstName}`}
        description="Vue d'ensemble de l'entraînement de vos équipes : participation, niveau et priorités d'accompagnement."
        actions={
          <ButtonLink href="/manager/competences" variant="secondary">
            Analyser les compétences
          </ButtonLink>
        }
        meta={
          <>
            <Badge tone="marque">{data.profile.role}</Badge>
            <Badge>{data.organisation}</Badge>
            <Badge>{data.repsCount} commerciaux suivis</Badge>
          </>
        }
      />

      {/* Analyses réellement produites par le Coach IA, jamais mêlées aux chiffres fictifs. */}
      <div className="mb-8">
        <RealReportsPanel />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 border-t border-line pt-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Vue d&apos;équipe</h2>
        <DemoBadge>Données de démonstration</DemoBadge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Commerciaux"
          value={data.repsCount}
          icon={<Users size={18} aria-hidden />}
          hint="Répartis sur trois équipes terrain."
        />
        <MetricCard
          label="Simulations réalisées"
          value={data.sessionsCount}
          icon={<CalendarCheck size={18} aria-hidden />}
          hint="Depuis le lancement du dispositif."
        />
        <MetricCard
          label="Taux de participation"
          value={data.participationRate}
          unit="%"
          icon={<Activity size={18} aria-hidden />}
          hint="Commerciaux ayant réalisé au moins une simulation ce mois-ci."
        />
        <MetricCard
          label="Score moyen de l'équipe"
          value={data.teamAverageScore}
          unit="/ 100"
          icon={<Gauge size={18} aria-hidden />}
          delta={data.averageProgress}
        />
        <MetricCard
          label="Progression moyenne"
          value={`+${data.averageProgress}`}
          unit="pts"
          icon={<TrendingUp size={18} aria-hidden />}
          hint="Moyenne des progressions individuelles sur trente jours."
        />
        <MetricCard
          label="Compétences à renforcer"
          value={data.competenciesToStrengthen}
          icon={<Target size={18} aria-hidden />}
          hint="Compétences dont la moyenne d'équipe reste sous 60."
          accent
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title="Évolution hebdomadaire"
          description="Score moyen de l'équipe, semaine par semaine."
          className="lg:col-span-3"
        >
          <WeeklyEvolutionChart data={data.weeklyEvolution} />
        </Panel>

        <Panel
          title="Répartition des scores"
          description="Nombre de commerciaux par tranche."
          className="lg:col-span-2"
        >
          <ScoreDistributionChart data={data.scoreDistribution} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Commerciaux × compétences"
          description="Lecture rapide des points solides et des compétences à accompagner."
        >
          <SkillsHeatmap members={data.members} />
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title="Commerciaux"
          description="Score moyen et progression sur trente jours."
          className="lg:col-span-3"
          action={
            <ButtonLink href="/manager/commerciaux" variant="secondary">
              Tout voir
            </ButtonLink>
          }
        >
          <TeamMemberList members={data.members} />
        </Panel>

        <Panel
          title="Alertes pédagogiques"
          description="Propositions d'accompagnement, sans notion de sanction."
          className="lg:col-span-2"
          action={<CoachMascot size="sm" />}
        >
          <PedagogicalAlerts alerts={data.alerts} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Simulations récentes" description="Les derniers entraînements de l'équipe.">
          <SessionTable sessions={data.recentSessions} showRep />
        </Panel>
      </div>
    </>
  );
}
