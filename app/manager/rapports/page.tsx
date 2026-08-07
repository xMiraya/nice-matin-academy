import type { Metadata } from "next";
import { FileBarChart } from "lucide-react";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { EmptyState } from "@/src/components/EmptyState";
import { DemoBadge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import {
  ScoreDistributionChart,
  WeeklyEvolutionChart,
} from "@/src/components/charts/ProgressChart";

export const metadata: Metadata = {
  title: "Rapports",
  description: "Synthèses périodiques du dispositif d'entraînement.",
};

export default function ManagerRapportsPage() {
  const data = DEMO_MANAGER_DASHBOARD;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Rapports"
        description="Synthèse du dispositif d'entraînement sur les sept dernières semaines."
        actions={<DemoBadge>Export bientôt disponible</DemoBadge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Commerciaux suivis" value={data.repsCount} />
        <MetricCard label="Simulations" value={data.sessionsCount} />
        <MetricCard label="Participation" value={data.participationRate} unit="%" />
        <MetricCard
          label="Score moyen"
          value={data.teamAverageScore}
          unit="/ 100"
          delta={data.averageProgress}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Évolution hebdomadaire">
          <WeeklyEvolutionChart data={data.weeklyEvolution} />
        </Panel>
        <Panel title="Répartition des scores">
          <ScoreDistributionChart data={data.scoreDistribution} />
        </Panel>
      </div>

      <div className="mt-6">
        <EmptyState
          icon={<FileBarChart size={20} aria-hidden />}
          title="Rapports exportables en préparation"
          description="La génération de synthèses mensuelles au format document sera ajoutée après la connexion des données réelles."
          action={
            <ButtonLink href="/manager" variant="secondary">
              Revenir à la vue équipe
            </ButtonLink>
          }
        />
      </div>
    </>
  );
}
