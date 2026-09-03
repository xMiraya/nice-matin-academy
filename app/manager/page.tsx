import type { Metadata } from "next";
import {
  Activity,
  CalendarCheck,
  Gauge,
  Radar,
  TrendingUp,
  Users,
} from "lucide-react";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { COMPETENCIES, getCompetency } from "@/src/data/competencies";
import type { CompetencyId } from "@/src/types";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel, SectionTitle } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { Badge, DemoBadge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { Sparkline } from "@/src/components/Sparkline";
import { SkillsHeatmap } from "@/src/components/SkillsHeatmap";
import { SessionTable } from "@/src/components/SessionTable";
import {
  InactiveMembers,
  PedagogicalAlerts,
  TeamMemberList,
} from "@/src/components/TeamMemberList";
import { CoachFocusHero } from "@/src/components/CoachPriorityCard";
import { TeamSpotlight } from "@/src/components/TeamSpotlight";
import { RealReportsPanel } from "@/src/components/coach/RealReportsPanel";
import {
  ScoreDistributionChart,
  WeeklyEvolutionChart,
} from "@/src/components/charts/ProgressChart";
import { scoreColor } from "@/src/lib/format";

export const metadata: Metadata = {
  title: "Vue équipe",
  description: "Tableau de bord de la direction commerciale.",
};

/** Moyenne d'équipe pour chaque compétence du référentiel. */
function teamCompetencyAverages(members: typeof DEMO_MANAGER_DASHBOARD.members) {
  return COMPETENCIES.map((competency) => {
    const total = members.reduce((sum, member) => {
      const score = member.competencyScores.find((s) => s.competencyId === competency.id);
      return sum + (score?.score ?? 0);
    }, 0);
    return {
      competencyId: competency.id as CompetencyId,
      score: Math.round(total / members.length),
    };
  });
}

export default function ManagerDashboardPage() {
  const data = DEMO_MANAGER_DASHBOARD;

  const averages = teamCompetencyAverages(data.members);
  const ranked = [...averages].sort((a, b) => a.score - b.score);
  const weakest = ranked[0];
  const strongest = ranked.at(-1);
  const weakestCompetency = getCompetency(weakest.competencyId);

  // Les chiffres de la carte d'ouverture sont recalculés à partir des mêmes
  // scores que la carte thermique : aucun écart possible d'un bloc à l'autre.
  const toStrengthen = averages.filter((entry) => entry.score < 60).length;
  const gapToAverage = data.teamAverageScore - weakest.score;

  // L'alerte de plus haute priorité fournit l'intitulé de la carte d'ouverture.
  const leadAlert = data.alerts.find((alert) => alert.level === "priorite") ?? data.alerts[0];

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title={`Bonjour ${data.profile.firstName}`}
        description="Où en est l'entraînement de vos équipes : engagement, niveau et priorités d'accompagnement."
        actions={
          <>
            <ButtonLink href="/manager/commerciaux" variant="secondary">
              <Users size={16} aria-hidden />
              Voir les commerciaux
            </ButtonLink>
            <ButtonLink href="/manager/competences">
              <Radar size={16} aria-hidden />
              Analyser les compétences
            </ButtonLink>
          </>
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

      <SectionTitle
        description="Chiffres d'illustration, en attendant le déploiement complet du dispositif."
        action={<DemoBadge>Données de démonstration</DemoBadge>}
      >
        Vue d&apos;équipe
      </SectionTitle>

      {/*
        1 — Ce qui demande une décision cette semaine, en tout premier : ce
        bloc a été remonté de la troisième à la première position. C'est ici
        que le manager doit agir, avant même les indicateurs de tendance.
      */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="À traiter cette semaine"
          description="Propositions d'accompagnement, sans notion de sanction."
          className="lg:col-span-7"
          action={<Badge tone="critique">{data.alerts.length}</Badge>}
        >
          <PedagogicalAlerts alerts={data.alerts} />
        </Panel>

        <Panel
          title="À relancer"
          description="Sans simulation depuis plus de deux semaines."
          className="lg:col-span-5"
        >
          <InactiveMembers members={data.members} />
        </Panel>
      </div>

      {/* 2 — La priorité collective et le niveau moyen, côte à côte. */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <CoachFocusHero
          className="lg:col-span-8"
          eyebrow="Priorité collective"
          showMascot={false}
          actionTitle="Ce que vous pouvez engager"
          priority={{
            competencyId: weakest.competencyId,
            title: leadAlert?.title ?? `${weakestCompetency.label} : compétence la plus fragile`,
            diagnostic: `Moyenne d'équipe de ${weakest.score} / 100 sur cette compétence, soit ${gapToAverage} points sous la moyenne générale (${data.teamAverageScore} / 100) : c'est la plus fragile des huit.`,
            action: `Ouvrir le détail de la compétence pour repérer les commerciaux concernés, puis programmer un temps collectif : « ${weakestCompetency.description} »`,
          }}
          score={weakest.score}
          actionHref="/manager/competences"
          actionLabel="Analyser cette compétence"
          secondaryHref="/manager/commerciaux"
          secondaryLabel="Voir les commerciaux concernés"
        />

        <div className="flex flex-col gap-5 lg:col-span-4">
          <MetricCard
            label="Score moyen de l'équipe"
            value={data.teamAverageScore}
            unit="/ 100"
            icon={<Gauge size={18} aria-hidden />}
            delta={data.averageProgress}
            deltaSuffix="pts sur 30 jours"
            className="flex-1"
            footer={
              <Sparkline
                values={data.weeklyEvolution.map((week) => week.score)}
                color={scoreColor(data.teamAverageScore)}
                label="Évolution hebdomadaire du score moyen"
              />
            }
          />

          <MetricCard
            label="Taux de participation"
            value={data.participationRate}
            unit="%"
            icon={<Activity size={17} aria-hidden />}
            hint="Commerciaux ayant réalisé au moins une simulation ce mois-ci."
            tone="ciel"
          />
        </div>
      </div>

      {/* 3 — Les repères de volume et de couverture. */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Commerciaux"
          value={data.repsCount}
          icon={<Users size={17} aria-hidden />}
          hint="Répartis sur trois équipes terrain."
        />
        <MetricCard
          label="Simulations réalisées"
          value={data.sessionsCount}
          icon={<CalendarCheck size={17} aria-hidden />}
          hint="Depuis le lancement du dispositif."
        />
        <MetricCard
          label="Progression moyenne"
          value={`+${data.averageProgress}`}
          unit="pts"
          icon={<TrendingUp size={17} aria-hidden />}
          hint="Moyenne des progressions individuelles sur trente jours."
          tone="positif"
        />
        <MetricCard
          label="Compétences à renforcer"
          value={toStrengthen}
          icon={<Radar size={17} aria-hidden />}
          hint="Compétences dont la moyenne d'équipe reste sous 60."
          tone="vigilance"
        />
      </div>

      {/* 4 — La tendance, moins urgente que les deux blocs précédents. */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="Évolution hebdomadaire"
          description="Score moyen de l'équipe, semaine par semaine."
          className="lg:col-span-7"
          flush
        >
          <WeeklyEvolutionChart data={data.weeklyEvolution} height={300} />
        </Panel>

        <Panel title="Répartition des scores" description="Nombre de commerciaux par tranche." className="lg:col-span-5" flush>
          <ScoreDistributionChart data={data.scoreDistribution} height={300} />
        </Panel>
      </div>

      {/* 5 — Qui porte l'équipe, qui a le plus besoin d'accompagnement. */}
      <div className="mt-5">
        <TeamSpotlight members={data.members} />
      </div>

      {/* 6 — La lecture croisée, pour aller plus loin que les deux profils mis en avant. */}
      <div className="mt-5">
        <Panel
          title="Commerciaux × compétences"
          description={`Point solide de l'équipe : ${strongest ? getCompetency(strongest.competencyId).label.toLowerCase() : "—"}. Point fragile : ${weakestCompetency.label.toLowerCase()}.`}
          action={
            <ButtonLink href="/manager/competences" variant="secondary" size="sm">
              Détail par compétence
            </ButtonLink>
          }
        >
          <SkillsHeatmap members={data.members} />
        </Panel>
      </div>

      {/* 7 — Le suivi individuel complet, consulté moins souvent que la carte thermique. */}
      <div className="mt-5">
        <Panel
          title="Commerciaux"
          description="Score moyen, progression sur trente jours et compétence à travailler."
          action={
            <ButtonLink href="/manager/commerciaux" variant="secondary" size="sm">
              Tout voir
            </ButtonLink>
          }
        >
          <TeamMemberList members={data.members} />
        </Panel>
      </div>

      {/* 8 — Le flux d'activité récente, en toute fin de page. */}
      <div className="mt-5">
        <Panel
          title="Simulations récentes"
          description="Les derniers entraînements de l'équipe."
          action={
            <ButtonLink href="/manager/simulations" variant="secondary" size="sm">
              Toutes les simulations
            </ButtonLink>
          }
        >
          <SessionTable sessions={data.recentSessions} showRep />
        </Panel>
      </div>
    </>
  );
}
