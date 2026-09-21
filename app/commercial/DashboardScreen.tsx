"use client";

import Link from "next/link";
import {
  Award,
  CalendarCheck,
  ChevronRight,
  Flame,
  Gauge,
  Target,
  Video,
} from "lucide-react";
import { getCompetency, getCompetencyLabel } from "@/src/data/competencies";
import type { CompetencyId, CompetencyScore } from "@/src/types";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { PageLoading } from "@/src/components/PageLoading";
import { MetricCard } from "@/src/components/MetricCard";
import { ButtonLink } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { CoachFocusHero } from "@/src/components/CoachPriorityCard";
import { SessionTable } from "@/src/components/SessionTable";
import { TrainingShortcuts } from "@/src/components/TrainingShortcuts";
import { Sparkline } from "@/src/components/Sparkline";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ProgressChart } from "@/src/components/charts/ProgressChart";
import { ScoreBar } from "@/src/components/ScoreGauge";
import { useCurrentUser } from "@/src/components/CurrentUser";
import { useIsHydrated, useReports } from "@/src/lib/reports/use-reports";
import { computeReportInsights, weeklyStreak } from "@/src/lib/reports/report-insights";
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
 * maintenant, où j'en suis, et sur quoi s'appuie ce diagnostic. Tous les
 * chiffres viennent des comptes rendus réellement produits par le Coach.
 */
export function DashboardScreen() {
  const profile = useCurrentUser();
  const reports = useReports();
  const loaded = useIsHydrated();
  const insights = computeReportInsights(reports, "/commercial/simulations");

  if (!loaded) return <PageLoading />;

  const header = (
    <PageHeader
      image="/images/hero/commercial.jpg"
      eyebrow="Espace commercial"
      title={`Bonjour ${profile.firstName}`}
      description={
        insights.hasReports
          ? "Vos chiffres sont calculés à partir de vos analyses du Coach IA."
          : "Lancez votre première simulation : le Coach IA analysera votre appel et vos huit compétences."
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
          {insights.hasReports ? (
            <Badge tone="positif" dot>
              {insights.count} analyse{insights.count > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </>
      }
    />
  );

  if (!insights.hasReports) {
    return (
      <>
        {header}
        <section aria-labelledby="poursuivre">
          <h2 id="poursuivre" className="nm-display mb-4 text-xl text-ink">
            Par où commencer
          </h2>
          <TrainingShortcuts />
        </section>
      </>
    );
  }

  const competencyScores = insights.competencyAverages;
  const scoreHistory = insights.scoreHistory;
  const sparkValues = scoreHistory.map((point) => point.score);
  const headlineScore = insights.latestScore ?? 0;
  const strongestScore = insights.strongest?.score ?? 0;
  const priorityScore = insights.priority?.score ?? 0;
  const streak = weeklyStreak(reports);

  const focus = {
    title: `Travailler : ${insights.priority?.label ?? ""}`,
    diagnostic: `Sur vos analyses, cette compétence est à ${priorityScore} / 100, la plus fragile des huit.`,
    action:
      "Sélectionnez cet objectif lors de votre prochaine simulation pour concentrer l'analyse dessus.",
    competencyId: (insights.priority?.id ?? "premier-contact") as CompetencyId,
  };

  const objectives = nextObjectives(competencyScores);

  // Le compte rendu le plus récent, cible du clic sur « Dernière note du Coach ».
  const latestSessionHref = insights.sessions[0]?.href ?? "/commercial/simulations";

  return (
    <>
      {header}

      {/* 1 — La recommandation du Coach et le niveau du jour, côte à côte. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <CoachFocusHero
          className="lg:col-span-8"
          priority={focus}
          score={priorityScore}
          actionHref="/commercial/nouvelle-simulation"
          secondaryHref="/commercial/nouvelle-simulation"
        />

        <div className="flex flex-col gap-5 lg:col-span-4">
          <MetricCard
            label="Dernière note du Coach"
            value={headlineScore}
            unit="/ 100"
            icon={<Gauge size={18} aria-hidden />}
            delta={insights.progression ?? undefined}
            deltaSuffix="pts depuis la 1re analyse"
            className="flex-1"
            href={latestSessionHref}
            linkLabel="Ouvrir le compte rendu"
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
              value={insights.count}
              icon={<CalendarCheck size={17} aria-hidden />}
              hint={`Moyenne ${insights.averageScore} / 100.`}
              href="/commercial/simulations"
              linkLabel="Mes simulations"
            />
            <MetricCard
              label="Régularité"
              value={streak}
              unit="sem."
              icon={<Flame size={17} aria-hidden />}
              hint="Semaines consécutives."
              tone="ciel"
              href="/commercial/progression"
              linkLabel="Ma progression"
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
          hint={insights.strongest?.label}
          tone="positif"
          href="/commercial/fiches"
          linkLabel="Relire la fiche méthodologique"
        />
        <MetricCard
          label="Compétence prioritaire"
          value={priorityScore}
          unit="/ 100"
          icon={<Target size={18} aria-hidden />}
          hint={insights.priority?.label}
          tone="vigilance"
          href="/commercial/nouvelle-simulation"
          linkLabel="Travailler cette compétence"
        />
      </div>

      {/* 3 — Ce sur quoi le diagnostic s'appuie. */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="Évolution des scores"
          description="Une valeur par analyse réalisée."
          className="lg:col-span-7"
          flush
        >
          {scoreHistory.length < 2 ? (
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
          description="Moyenne de vos analyses."
          className="lg:col-span-5"
          flush
        >
          <CompetencyRadar scores={competencyScores} seriesLabel="Vos analyses" height={300} />
        </Panel>
      </div>

      {/* 4 — Le détail compétence par compétence, puis les objectifs suivants. */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="Vos huit compétences"
          description="Du niveau le plus solide au plus fragile."
          className="lg:col-span-7"
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

      {/* 5 — Et maintenant, je fais quoi : les trois portes d'entrée. */}
      <section className="mt-5" aria-labelledby="poursuivre">
        <h2 id="poursuivre" className="nm-display mb-4 text-xl text-ink">
          Poursuivre l&apos;entraînement
        </h2>
        <TrainingShortcuts />
      </section>

      {/* 6 — L'historique, en fin de page : on le consulte, on n'en part pas. */}
      <div className="mt-5">
        <Panel
          title="Vos analyses"
          description="Comptes rendus produits par le Coach IA."
          action={
            <ButtonLink href="/commercial/simulations" variant="secondary" size="sm">
              Tout l&apos;historique
            </ButtonLink>
          }
        >
          <SessionTable sessions={insights.sessions.slice(0, 4)} />
        </Panel>
      </div>
    </>
  );
}
