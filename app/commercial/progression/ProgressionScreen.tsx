"use client";

import { TrendingUp } from "lucide-react";
import type { CompetencyId, CoachPriority } from "@/src/types";
import { getCompetency, getCompetencyLabel } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { PageLoading } from "@/src/components/PageLoading";
import { EmptyState } from "@/src/components/EmptyState";
import { ButtonLink } from "@/src/components/Button";
import { MetricCard } from "@/src/components/MetricCard";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ProgressChart } from "@/src/components/charts/ProgressChart";
import { CoachPriorityCard } from "@/src/components/CoachPriorityCard";
import { useIsHydrated, useReports } from "@/src/lib/reports/use-reports";
import {
  competencyDeltas,
  computeReportInsights,
  weeklyStreak,
} from "@/src/lib/reports/report-insights";
import { cx, formatDelta } from "@/src/lib/format";
import { evaluatedReports } from "@/src/lib/coach/evaluability";

/** Progression du commercial connecté, calculée sur ses comptes rendus. */
export function ProgressionScreen() {
  const reports = useReports();
  const loaded = useIsHydrated();
  if (!loaded) return <PageLoading />;

  const insights = computeReportInsights(reports, "/commercial/simulations");

  const header = (
    <PageHeader
      eyebrow="Espace commercial"
      title="Votre progression"
      description="Comment vos compétences évoluent d'une simulation à l'autre."
    />
  );

  if (!insights.hasReports || !insights.priority) {
    return (
      <>
        {header}
        <EmptyState
          image="/images/etats/aucune-simulation.jpg"
          icon={<TrendingUp size={20} aria-hidden />}
          title="Votre progression commence à la première simulation"
          description="Après chaque appel analysé, vos scores et l'évolution de vos huit compétences s'affichent ici."
          action={<ButtonLink href="/commercial/nouvelle-simulation">Commencer une simulation</ButtonLink>}
        />
      </>
    );
  }

  const deltas = competencyDeltas(reports);
  const withDelta = insights.competencyAverages.map((score) => ({
    ...score,
    delta: deltas[score.competencyId] ?? 0,
  }));
  const byDelta = [...withDelta].sort((a, b) => b.delta - a.delta);

  const latest = [...evaluatedReports(reports)].sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))[0];
  const nextFocus: CoachPriority = {
    title: latest.pedagogicalPriority.label,
    diagnostic: latest.pedagogicalPriority.reason,
    action:
      latest.nextActions[0]?.instruction ?? "Reprenez cette compétence lors de votre prochaine simulation.",
    competencyId: latest.pedagogicalPriority.competencyId as CompetencyId,
  };

  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MetricCard
          label="Score moyen"
          value={insights.averageScore ?? 0}
          unit="/ 100"
          delta={insights.progression ?? undefined}
          deltaSuffix="pts depuis la 1re analyse"
        />
        <MetricCard
          label="Régularité"
          value={weeklyStreak(reports)}
          unit="semaines"
          hint="Semaines consécutives avec au moins une simulation."
          icon={<TrendingUp size={18} aria-hidden />}
        />
        <MetricCard
          label="Compétence prioritaire"
          value={insights.priority.score}
          unit="/ 100"
          hint={getCompetency(insights.priority.id as CompetencyId).description}
          accent
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Courbe des scores" description="Une valeur par simulation analysée.">
          {insights.scoreHistory.length < 2 ? (
            <p className="py-10 text-center text-sm text-graphite">
              La courbe apparaîtra dès votre deuxième simulation analysée.
            </p>
          ) : (
            <ProgressChart data={insights.scoreHistory} height={300} />
          )}
        </Panel>

        <Panel title="Profil actuel" description="Moyenne de vos huit compétences.">
          <CompetencyRadar scores={insights.competencyAverages} seriesLabel="Votre niveau" height={300} />
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Panel
          title="Variation par compétence"
          description="Écart en points entre votre dernière simulation et la précédente."
          className="lg:col-span-3"
        >
          <ul className="divide-y divide-line">
            {byDelta.map((score) => (
              <li
                key={score.competencyId}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-medium text-ink">
                  {getCompetencyLabel(score.competencyId)}
                </span>
                <span className="flex items-center gap-4">
                  <span className="text-sm tabular-nums text-graphite">{score.score} / 100</span>
                  <span
                    className={cx(
                      "min-w-12 rounded-sm px-2 py-1 text-center text-xs font-semibold tabular-nums",
                      score.delta > 0
                        ? "bg-positive/10 text-positive"
                        : score.delta < 0
                          ? "bg-danger/10 text-danger"
                          : "bg-mist text-graphite",
                    )}
                  >
                    {formatDelta(score.delta)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="lg:col-span-2">
          <CoachPriorityCard
            priority={nextFocus}
            accent
            actionHref="/commercial/nouvelle-simulation"
            actionLabel="Lancer un entraînement ciblé"
          />
        </div>
      </div>
    </>
  );
}
