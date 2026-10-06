"use client";

import {
  Activity,
  CalendarCheck,
  Gauge,
  Radar,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageLoading } from "@/src/components/PageLoading";
import { useManagerDashboard } from "@/src/lib/team/use-manager-dashboard";
import { teamCompetencyAverages } from "@/src/lib/team/team-insights";
import { getCompetency } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel, SectionTitle } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { Badge } from "@/src/components/StatusBadge";
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
import { QuickJumpNav } from "@/src/components/QuickJumpNav";
import {
  ScoreDistributionChart,
  WeeklyEvolutionChart,
} from "@/src/components/charts/ProgressChart";
import { scoreColor } from "@/src/lib/format";

/** Sections de la page, utilisées à la fois par les ancres et par le fil de repères. */
const SECTIONS = [
  { id: "priorites", label: "Priorités" },
  { id: "tendance", label: "Tendance" },
  { id: "competences", label: "Compétences" },
  { id: "equipe", label: "Équipe" },
  { id: "simulations", label: "Simulations" },
] as const;

export function ManagerDashboardScreen() {
  const { dashboard: data } = useManagerDashboard();
  if (!data) return <PageLoading />;

  const withData = data.members.filter((member) => member.sessionsCount > 0);
  const hasData = withData.length > 0;
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
        image="/images/hero/manager.jpg"
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

      <SectionTitle description="Calculée à partir des simulations réellement réalisées par vos commerciaux.">
        Vue d&apos;équipe
      </SectionTitle>

      {/*
        Raccourcis de section : cette page empile huit blocs assez longs. Un
        repère de navigation en haut permet de sauter directement à la partie
        recherchée — utile au clavier, au lecteur d'écran, et tout simplement
        à qui ne veut pas tout parcourir pour retrouver un bloc déjà vu.
      */}
      <QuickJumpNav sections={SECTIONS} />

      {/*
        1 — Ce qui demande une décision cette semaine, en tout premier : ce
        bloc a été remonté de la troisième à la première position. C'est ici
        que le manager doit agir, avant même les indicateurs de tendance.
      */}
      <section id="priorites" aria-label="Priorités de la semaine" className="scroll-mt-20">
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

        {/* La priorité collective et le niveau moyen, côte à côte. */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {hasData ? (
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
          ) : (
            <Panel
              title="Priorité collective"
              description="Elle apparaîtra dès la première simulation analysée."
              className="lg:col-span-8"
            >
              <p className="text-sm leading-relaxed text-graphite">
                Aucune simulation n&apos;a encore été réalisée par votre équipe. Dès qu&apos;un commercial
                aura terminé un appel avec Julie, la compétence la plus fragile et les actions à
                engager s&apos;afficheront ici.
              </p>
            </Panel>
          )}

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

        {/* Les repères de volume et de couverture. */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Commerciaux"
            value={data.repsCount}
            icon={<Users size={17} aria-hidden />}
            hint="Comptes actifs de votre équipe."
          />
          <MetricCard
            label="Simulations réalisées"
            value={data.sessionsCount}
            icon={<CalendarCheck size={17} aria-hidden />}
            hint={
              (data.attemptsCount ?? data.sessionsCount) > data.sessionsCount
                ? `Évaluées, sur ${data.attemptsCount} tentatives.`
                : "Depuis le lancement du dispositif."
            }
          />
          <MetricCard
            label="Progression moyenne"
            value={data.averageProgress > 0 ? `+${data.averageProgress}` : data.averageProgress}
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
      </section>

      {/* 4 — La tendance, moins urgente que les deux blocs précédents. */}
      <section id="tendance" aria-label="Tendance" className="mt-5 scroll-mt-20">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel
            title="Évolution hebdomadaire"
            description="Score moyen de l'équipe, semaine par semaine."
            className="lg:col-span-7"
            flush
          >
            <WeeklyEvolutionChart data={data.weeklyEvolution} height={300} />
          </Panel>

          <Panel
            title="Répartition des scores"
            description="Nombre de commerciaux par tranche."
            className="lg:col-span-5"
            flush
          >
            <ScoreDistributionChart data={data.scoreDistribution} height={300} />
          </Panel>
        </div>
      </section>

      {/* 5 — Qui porte l'équipe, qui a le plus besoin d'accompagnement. */}
      <div className="mt-5">
        <TeamSpotlight members={withData} />
      </div>

      {/* 6 — La lecture croisée, pour aller plus loin que les deux profils mis en avant. */}
      <section id="competences" aria-label="Compétences" className="mt-5 scroll-mt-20">
        <Panel
          title="Commerciaux × compétences"
          description={hasData ? `Point solide de l'équipe : ${strongest ? getCompetency(strongest.competencyId).label.toLowerCase() : "—"}. Point fragile : ${weakestCompetency.label.toLowerCase()}.` : "Disponible dès les premières simulations."}
          action={
            <ButtonLink href="/manager/competences" variant="secondary" size="sm">
              Détail par compétence
            </ButtonLink>
          }
        >
          <SkillsHeatmap members={withData} />
        </Panel>
      </section>

      {/* 7 — Le suivi individuel complet, consulté moins souvent que la carte thermique. */}
      <section id="equipe" aria-label="Équipe" className="mt-5 scroll-mt-20">
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
      </section>

      {/* 8 — Le flux d'activité récente, en toute fin de page. */}
      <section id="simulations" aria-label="Simulations récentes" className="mt-5 scroll-mt-20">
        <Panel
          title="Simulations récentes"
          description="Les derniers entraînements de l'équipe."
          action={
            <ButtonLink href="/manager/simulations" variant="secondary" size="sm">
              Toutes les simulations
            </ButtonLink>
          }
        >
          <SessionTable sessions={data.recentSessions.slice(0, 8)} showRep />
        </Panel>
      </section>
    </>
  );
}
