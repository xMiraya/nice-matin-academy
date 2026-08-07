import type { Metadata } from "next";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { SessionTable } from "@/src/components/SessionTable";
import { DemoBadge } from "@/src/components/StatusBadge";
import { RealReportsPanel } from "@/src/components/coach/RealReportsPanel";

export const metadata: Metadata = {
  title: "Simulations",
  description: "Suivi des simulations réalisées par l'équipe.",
};

export default function ManagerSimulationsPage() {
  const data = DEMO_MANAGER_DASHBOARD;
  const analysed = data.recentSessions.filter((s) => s.status === "en-analyse").length;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Simulations"
        description="Tous les entraînements de l'équipe, du plus récent au plus ancien."
      />

      <div className="mb-8">
        <RealReportsPanel />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 border-t border-line pt-8">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Vue d&apos;ensemble</h2>
        <DemoBadge>Données de démonstration</DemoBadge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Simulations réalisées" value={data.sessionsCount} />
        <MetricCard label="Analyses en cours" value={analysed} hint="Comptes rendus en préparation." />
        <MetricCard
          label="Score moyen"
          value={data.teamAverageScore}
          unit="/ 100"
          delta={data.averageProgress}
        />
      </div>

      <div className="mt-6">
        <Panel
          title="Dernières simulations"
          description="Seul l'appel de validation technique dispose d'un compte rendu complet dans cette maquette."
        >
          <SessionTable sessions={data.recentSessions} showRep />
        </Panel>
      </div>
    </>
  );
}
