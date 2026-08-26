"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  ChevronRight,
  Flame,
  Gauge,
  Target,
  Video,
} from "lucide-react";
import {
  DEMO_COMMERCIAL_DASHBOARD,
  DEMO_COMMERCIAL_TECHNICAL_SESSION,
} from "@/src/data/demo-commercial";
import { getCompetency, getCompetencyLabel } from "@/src/data/competencies";
import type { CompetencyId, CompetencyScore } from "@/src/types";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { ButtonLink } from "@/src/components/Button";
import { Badge, DemoBadge } from "@/src/components/StatusBadge";
import { CoachFocusHero } from "@/src/components/CoachPriorityCard";
import { SessionTable } from "@/src/components/SessionTable";
import { Sparkline } from "@/src/components/Sparkline";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ProgressChart } from "@/src/components/charts/ProgressChart";
import { ScoreBar } from "@/src/components/ScoreGauge";
import { useReports } from "@/src/lib/reports/use-reports";
import { computeReportInsights } from "@/src/lib/reports/report-insights";
import { scoreColor, scoreLabel } from "@/src/lib/format";
import { NM } from "@/src/lib/theme";

const LEVEL_LABELS = {
  debutant: "Niveau débutant",
  intermediaire: "Niveau intermédiaire",
  confirme: "Niveau confirmé",
} as const;

/** Les trois compétences les plus fragiles, proposées comme prochains objectifs. */
function nextObjectives(scores: CompetencyScore[]) {
  return [...scores].sort((a, b) => a.score - b.score).slice(0, 3);
}

/**
 * Tableau de bord du commercial.
 *
 * L'écran répond dans l'ordre à trois questions : que dois-je travailler
 * maintenant, où j'en suis, et sur quoi s'appuie ce diagnostic. Les comptes
 * rendus réels du Coach sont prioritaires ; les données de démonstration
 * restent visibles mais toujours identifiées comme telles, et les deux
 * ensembles ne sont jamais fondus dans une même moyenne.
 */
export function DashboardScreen() {
  const reports = useReports();
  const insights = computeReportInsights(reports, "/commercial/simulations");

  const demo = DEMO_COMMERCIAL_DASHBOARD;
  const { profile } = demo;

  const useReal = insights.hasReports;

  const competencyScores = useReal ? insights.competencyAverages : demo.competencyScores;
  const scoreHistory = useReal ? insights.scoreHistory : demo.scoreHistory;
  const sparkValues = scoreHistory.map((point) => point.score);

  const demoStrongest = demo.competencyScores.find((s) => s.competencyId === demo.strongest);
  const demoPriority = demo.competencyScores.find((s) => s.competencyId === demo.priority);

  const headlineScore = useReal ? (insights.latestScore ?? 0) : demo.averageScore;
  const strongestScore = useReal ? (insights.strongest?.score ?? 0) : (demoStrongest?.score ?? 0);
  const priorityScore = useReal ? (insights.priority?.score ?? 0) : (demoPriority?.score ?? 0);

  const focus =
    useReal && insights.priority
      ? {
          title: `Travailler : ${insights.priority.label}`,
          diagnostic: `Sur vos analyses réelles, cette compétence est à ${insights.priority.score} / 100, la plus fragile des huit.`,
          action:
            "Sélectionnez cet objectif lors de votre prochaine simulation pour concentrer l'analyse dessus.",
          competencyId: insights.priority.id as CompetencyId,
        }
      : demo.nextFocus;

  const objectives = nextObjectives(competencyScores);

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title={`Bonjour ${profile.firstName}`}
        description={
          useReal
            ? "Vos chiffres sont calculés à partir de vos analyses réelles du Coach IA."
            : "Voici où vous en êtes sur les huit compétences suivies par le Coach IA."
        }
        actions={
          <ButtonLink href="/commercial/nouvelle-simulation">
            <Video size={16} aria-hidden />
            Commencer une simulation
          </ButtonLink>
        }
        meta={
          <>
            <Badge tone="marque">{profile.role}</Badge>
            <Badge>{profile.team}</Badge>
            {profile.level ? <Badge>{LEVEL_LABELS[profile.level]}</Badge> : null}
            {useReal ? (
              <Badge tone="positif" dot>
                {insights.count} analyse{insights.count > 1 ? "s" : ""} réelle
                {insights.count > 1 ? "s" : ""}
              </Badge>
            ) : (
              <DemoBadge>Données de démonstration</DemoBadge>
            )}
          </>
        }
      />

      {/* 1 — La recommandation du Coach et le niveau du jour, côte à côte. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <CoachFocusHero
          className="lg:col-span-8"
          priority={focus}
          score={priorityScore}
          actionHref="/commercial/nouvelle-simulation"
          secondaryHref="/commercial/nouvelle-simulation"
          sourceNote={useReal ? undefined : "Exemple de recommandation"}
        />

        <div className="flex flex-col gap-5 lg:col-span-4">
          <MetricCard
            label={useReal ? "Dernière note du Coach" : "Score moyen"}
            value={headlineScore}
            unit="/ 100"
            icon={<Gauge size={18} aria-hidden />}
            delta={useReal ? (insights.progression ?? undefined) : demo.thirtyDayProgress}
            deltaSuffix={useReal ? "pts depuis la 1re analyse" : "pts sur 30 jours"}
            className="flex-1"
            footer={
              sparkValues.length >= 2 ? (
                <Sparkline
                  values={sparkValues}
                  color={scoreColor(headlineScore)}
                  label={`Évolution des ${sparkValues.length} dernières notes`}
                />
              ) : null
            }
          />

          <div className="grid grid-cols-2 gap-5">
            <MetricCard
              label="Simulations"
              value={useReal ? insights.count : demo.sessionsCount}
              icon={<CalendarCheck size={17} aria-hidden />}
              hint={useReal ? `Moyenne ${insights.averageScore} / 100.` : "Analysées à ce jour."}
            />
            <MetricCard
              label="Régularité"
              value={demo.participationStreakWeeks}
              unit="sem."
              icon={<Flame size={17} aria-hidden />}
              hint="Semaines consécutives."
              tone="ciel"
            />
          </div>
        </div>
      </div>

      {/* 2 — Le point fort et le point fragile, en lecture immédiate. */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <MetricCard
          label="Meilleure compétence"
          value={strongestScore}
          unit="/ 100"
          icon={<Award size={18} aria-hidden />}
          hint={useReal ? insights.strongest?.label : getCompetencyLabel(demo.strongest)}
          tone="positif"
        />
        <MetricCard
          label="Compétence prioritaire"
          value={priorityScore}
          unit="/ 100"
          icon={<Target size={18} aria-hidden />}
          hint={useReal ? insights.priority?.label : getCompetencyLabel(demo.priority)}
          tone="vigilance"
        />
      </div>

      {/* 3 — Ce sur quoi le diagnostic s'appuie. */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="Évolution des scores"
          description={useReal ? "Une valeur par analyse réalisée." : "Exemple d'évolution."}
          className="lg:col-span-7"
          action={useReal ? null : <DemoBadge />}
          flush
        >
          {useReal && insights.scoreHistory.length < 2 ? (
            <div className="flex h-[260px] flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-semibold text-ink">Une seule analyse pour le moment</p>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                La courbe d&apos;évolution apparaîtra dès votre deuxième simulation analysée.
              </p>
            </div>
          ) : (
            <ProgressChart data={scoreHistory} height={280} />
          )}
        </Panel>

        <Panel
          title="Profil de compétences"
          description={
            useReal ? "Moyenne de vos analyses réelles." : "Exemple de profil, à titre d'illustration."
          }
          className="lg:col-span-5"
          action={useReal ? null : <DemoBadge />}
          flush
        >
          <CompetencyRadar
            scores={competencyScores}
            seriesLabel={useReal ? "Vos analyses" : "Exemple"}
            height={300}
          />
        </Panel>
      </div>

      {/* 4 — Le détail compétence par compétence, puis les objectifs suivants. */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="Vos huit compétences"
          description="Du niveau le plus solide au plus fragile."
          className="lg:col-span-7"
          action={useReal ? null : <DemoBadge />}
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {[...competencyScores]
              .sort((a, b) => b.score - a.score)
              .map((score) => (
                <ScoreBar
                  key={score.competencyId}
                  score={score.score}
                  delta={score.delta}
                  label={getCompetencyLabel(score.competencyId)}
                />
              ))}
          </div>
        </Panel>

        <Panel
          title="Vos trois prochains objectifs"
          description="Proposés à partir de vos compétences les plus fragiles."
          className="lg:col-span-5"
        >
          <ol className="space-y-3">
            {objectives.map((objective, index) => {
              const competency = getCompetency(objective.competencyId);
              return (
                <li key={objective.competencyId}>
                  <Link
                    href="/commercial/nouvelle-simulation"
                    className="flex items-start gap-3 rounded-md bg-mist/70 p-3.5 transition-colors hover:bg-brand-soft"
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xs text-xs font-semibold tabular-nums text-white"
                      style={{ backgroundColor: index === 0 ? NM.navy : NM.blue }}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink">
                          {competency.label}
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-graphite">
                          {objective.score} / 100
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-graphite">
                        {competency.description}
                      </span>
                      <span className="mt-2 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${objective.score}%`,
                              backgroundColor: scoreColor(objective.score),
                            }}
                          />
                        </span>
                        <span className="text-[11px] font-medium text-muted">
                          {scoreLabel(objective.score)}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      {/* 5 — L'historique, en fin de page : on le consulte, on n'en part pas. */}
      <div className="mt-5">
        <Panel
          title={useReal ? "Vos analyses" : "Dernières simulations"}
          description={
            useReal
              ? "Comptes rendus réellement produits par le Coach IA."
              : "Historique d'illustration, en attendant vos premières analyses."
          }
          action={
            <div className="flex items-center gap-2">
              {useReal ? null : <DemoBadge />}
              <ButtonLink href="/commercial/simulations" variant="secondary" size="sm">
                Tout l&apos;historique
              </ButtonLink>
            </div>
          }
        >
          <SessionTable sessions={useReal ? insights.sessions.slice(0, 4) : demo.recentSessions} />

          {/*
            L'appel de validation technique reste accessible mais ne prend plus
            une section entière du tableau de bord : c'est une information
            d'ingénierie, pas un repère de progression.
          */}
          <Link
            href={DEMO_COMMERCIAL_TECHNICAL_SESSION.href ?? "/commercial/simulations"}
            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md bg-warning-soft px-4 py-3 text-sm transition-colors hover:brightness-98"
          >
            <span className="font-semibold text-ink">Appel de validation technique</span>
            <span className="text-graphite">
              Voix française de Julie — exclu de vos statistiques.
            </span>
            <span className="ml-auto inline-flex items-center gap-1 font-semibold text-brand">
              Voir le compte rendu
              <ArrowRight size={14} aria-hidden />
            </span>
          </Link>
        </Panel>
      </div>
    </>
  );
}
