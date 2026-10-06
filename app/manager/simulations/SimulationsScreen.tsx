"use client";

import { PageLoading } from "@/src/components/PageLoading";
import { useManagerDashboard } from "@/src/lib/team/use-manager-dashboard";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel, SectionTitle } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { ManagerSimulationsExplorer } from "@/src/components/ManagerSimulationsExplorer";

export function ManagerSimulationsScreen() {
  const { dashboard: data } = useManagerDashboard();
  if (!data) return <PageLoading />;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Simulations"
        description="Recherchez un commercial, filtrez par statut, triez par date ou par score."
      />

      <SectionTitle description="Calculée à partir des simulations réellement réalisées.">
        Vue d&apos;ensemble
      </SectionTitle>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MetricCard
          label="Simulations réalisées"
          value={data.sessionsCount}
          hint={
            (data.attemptsCount ?? data.sessionsCount) > data.sessionsCount
              ? `Évaluées, sur ${data.attemptsCount} tentatives.`
              : undefined
          }
        />
        <MetricCard label="Commerciaux actifs" value={data.members.filter((m) => m.sessionsCount > 0).length} hint={`Sur ${data.repsCount} comptes.`} />
        <MetricCard
          label="Score moyen"
          value={data.teamAverageScore}
          unit="/ 100"
          delta={data.averageProgress}
        />
      </div>

      <div className="mt-5">
        <Panel
          title="Toutes les simulations"
          description="Ouvrez une simulation pour lire le compte rendu complet."
        >
          <ManagerSimulationsExplorer sessions={data.recentSessions} />
        </Panel>
      </div>
    </>
  );
}
