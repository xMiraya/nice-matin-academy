import type { Metadata } from "next";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel, SectionTitle } from "@/src/components/Panel";
import { MetricCard } from "@/src/components/MetricCard";
import { ManagerSimulationsExplorer } from "@/src/components/ManagerSimulationsExplorer";
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
        description="Recherchez un commercial, filtrez par statut, triez par date ou par score."
      />

      <div className="mb-8">
        <RealReportsPanel />
      </div>

      <SectionTitle
        description="Chiffres d'illustration, en attendant le déploiement complet du dispositif."
        action={<DemoBadge>Données de démonstration</DemoBadge>}
      >
        Vue d&apos;ensemble
      </SectionTitle>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MetricCard label="Simulations réalisées" value={data.sessionsCount} />
        <MetricCard label="Analyses en cours" value={analysed} hint="Comptes rendus en préparation." />
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
          description="Seul l'appel de validation technique dispose d'un compte rendu complet dans cette maquette."
        >
          <ManagerSimulationsExplorer sessions={data.recentSessions} />
        </Panel>
      </div>
    </>
  );
}
