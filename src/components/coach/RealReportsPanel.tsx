"use client";

import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { SessionTable } from "@/src/components/SessionTable";
import { MetricCard } from "@/src/components/MetricCard";
import { useReports } from "@/src/lib/reports/use-reports";
import { computeReportInsights } from "@/src/lib/reports/report-insights";

/**
 * Bloc « analyses réelles » réutilisé dans l'espace manager.
 *
 * Les comptes rendus proviennent du poste sur lequel la simulation a été
 * réalisée : en prototype, ils ne circulent pas encore entre appareils.
 */
export function RealReportsPanel({
  hrefPrefix = "/manager/simulations",
  showMetrics = true,
  title = "Analyses réelles du Coach IA",
}: {
  hrefPrefix?: string;
  showMetrics?: boolean;
  title?: string;
}) {
  const reports = useReports();
  const insights = computeReportInsights(reports, hrefPrefix);

  if (!insights.hasReports) {
    return (
      <Panel
        title={title}
        description="Aucune analyse réelle n'est enregistrée sur cet appareil."
      >
        <p className="text-sm leading-relaxed text-graphite">
          Les comptes rendus produits par le Coach IA sont stockés localement sur le poste qui a
          réalisé la simulation. Ils apparaîtront ici dès qu&apos;une analyse aura été effectuée sur
          cet appareil.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {showMetrics ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Analyses réelles" value={insights.count} />
          <MetricCard
            label="Moyenne réelle"
            value={insights.averageScore ?? 0}
            unit="/ 100"
            hint="Calculée uniquement sur les analyses du Coach IA."
          />
          <MetricCard
            label="Compétence à renforcer"
            value={insights.priority?.score ?? 0}
            unit="/ 100"
            hint={insights.priority?.label}
            accent
          />
        </div>
      ) : null}

      <Panel
        title={title}
        description="Comptes rendus réellement produits, hors données de démonstration."
        action={
          <Badge tone="positif">
            {insights.count} analyse{insights.count > 1 ? "s" : ""}
          </Badge>
        }
      >
        <SessionTable sessions={insights.sessions} showRep />
      </Panel>
    </div>
  );
}
