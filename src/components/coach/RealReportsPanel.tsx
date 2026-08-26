"use client";

import { Info } from "lucide-react";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { SessionTable } from "@/src/components/SessionTable";
import { useReports } from "@/src/lib/reports/use-reports";
import { computeReportInsights } from "@/src/lib/reports/report-insights";

/**
 * Bloc « analyses réelles » réutilisé dans l'espace manager.
 *
 * Les comptes rendus proviennent du poste sur lequel la simulation a été
 * réalisée : en prototype, ils ne circulent pas encore entre appareils. Tant
 * qu'aucune analyse n'existe, le bloc reste un simple bandeau d'information et
 * ne prend pas la place d'un tableau de bord.
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
      <div className="flex flex-wrap items-start gap-3 rounded-lg border border-line bg-white px-5 py-4 shadow-card">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-info-soft text-info">
          <Info size={17} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-graphite">
            Aucune analyse réelle n&apos;est enregistrée sur cet appareil. Les comptes rendus
            produits par le Coach IA sont stockés localement sur le poste qui a réalisé la
            simulation ; ils apparaîtront ici dès qu&apos;une analyse y aura été effectuée.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Panel
      title={title}
      description="Comptes rendus réellement produits, hors données de démonstration."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="positif" dot>
            {insights.count} analyse{insights.count > 1 ? "s" : ""}
          </Badge>
          {showMetrics && insights.averageScore !== null ? (
            <>
              <Badge tone="information">Moyenne {insights.averageScore} / 100</Badge>
              {insights.priority ? (
                <Badge tone="vigilance">
                  À renforcer : {insights.priority.label} ({insights.priority.score})
                </Badge>
              ) : null}
            </>
          ) : null}
        </div>
      }
    >
      <SessionTable sessions={insights.sessions} showRep />
    </Panel>
  );
}
