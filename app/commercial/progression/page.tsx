import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { DEMO_COMMERCIAL_DASHBOARD } from "@/src/data/demo-commercial";
import { getCompetency, getCompetencyLabel } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { ProgressChart } from "@/src/components/charts/ProgressChart";
import { CoachPriorityCard } from "@/src/components/CoachPriorityCard";
import { cx, formatDelta } from "@/src/lib/format";

export const metadata: Metadata = {
  title: "Progression",
  description: "Évolution des compétences commerciales dans le temps.",
};

export default function ProgressionPage() {
  const data = DEMO_COMMERCIAL_DASHBOARD;
  const byDelta = [...data.competencyScores].sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Votre progression"
        description="Comment vos compétences évoluent d'une simulation à l'autre."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Score moyen"
          value={data.averageScore}
          unit="/ 100"
          delta={data.thirtyDayProgress}
        />
        <MetricCard
          label="Régularité"
          value={data.participationStreakWeeks}
          unit="semaines"
          hint="Semaines consécutives avec au moins une simulation."
          icon={<TrendingUp size={18} aria-hidden />}
        />
        <MetricCard
          label="Compétence prioritaire"
          value={data.competencyScores.find((s) => s.competencyId === data.priority)?.score ?? 0}
          unit="/ 100"
          hint={getCompetency(data.priority).description}
          accent
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Courbe des scores" description="Six dernières simulations enregistrées.">
          <ProgressChart data={data.scoreHistory} height={300} />
        </Panel>

        <Panel title="Profil actuel" description="Vos huit compétences aujourd'hui.">
          <CompetencyRadar scores={data.competencyScores} seriesLabel="Votre niveau" height={300} />
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title="Variation par compétence"
          description="Écart en points par rapport à la simulation précédente."
          className="lg:col-span-3"
        >
          <ul className="divide-y divide-line">
            {byDelta.map((score) => {
              const delta = score.delta ?? 0;
              return (
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
                        delta > 0
                          ? "bg-positive/10 text-positive"
                          : delta < 0
                            ? "bg-danger/10 text-danger"
                            : "bg-mist text-graphite",
                      )}
                    >
                      {formatDelta(delta)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="lg:col-span-2">
          <CoachPriorityCard
            priority={data.nextFocus}
            accent
            actionHref="/commercial/nouvelle-simulation"
            actionLabel="Lancer un entraînement ciblé"
          />
        </div>
      </div>
    </>
  );
}
