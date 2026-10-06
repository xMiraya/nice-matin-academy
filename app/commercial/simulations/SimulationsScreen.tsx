"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { PageLoading } from "@/src/components/PageLoading";
import { SessionTable } from "@/src/components/SessionTable";
import { ButtonLink } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { useIsHydrated, useReports } from "@/src/lib/reports/use-reports";
import { computeReportInsights } from "@/src/lib/reports/report-insights";

/** Historique des simulations analysées du commercial connecté. */
export function SimulationsScreen() {
  const reports = useReports();
  const loaded = useIsHydrated();
  const insights = computeReportInsights(reports, "/commercial/simulations");
  if (!loaded) return <PageLoading />;

  // Le compte rendu le plus récent, mis en avant pour éviter de le chercher
  // dans le tableau après chaque simulation.
  const latest = insights.sessions[0];

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Mes simulations"
        description="Toutes vos simulations analysées par le Coach IA, de la plus récente à la plus ancienne."
        actions={<ButtonLink href="/commercial/nouvelle-simulation">Nouvelle simulation</ButtonLink>}
        meta={
          insights.hasReports ? (
            <Badge tone="positif">
              {insights.count} analyse{insights.count > 1 ? "s" : ""} du Coach IA
            </Badge>
          ) : null
        }
      />

      {/* Accès direct au dernier compte rendu produit */}
      {latest ? (
        <Link
          href={latest.href ?? "/commercial/simulations"}
          className="nm-card nm-navy mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 transition-shadow hover:shadow-lift"
        >
          <span className="min-w-0">
            <span className="nm-label block text-white/60">Votre dernière simulation</span>
            <span className="mt-1 block truncate text-base font-semibold text-white">
              {latest.title}
            </span>
          </span>
          <span className="text-sm font-semibold tabular-nums text-brand-sky">
            {latest.score === null ? "Non évaluée" : `${latest.score} / 100`}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            Ouvrir le compte rendu
            <ArrowRight size={15} aria-hidden />
          </span>
        </Link>
      ) : null}

      <div className="space-y-5 pb-2">
        {insights.sessions.length > 0 ? (
          <Panel
            title="Analyses du Coach IA"
            description={
              insights.hasReports
                ? `Moyenne de vos analyses : ${insights.averageScore} / 100.${
                    insights.attemptsCount > insights.count
                      ? " Les simulations non évaluées ne sont pas comptées."
                      : ""
                  }`
                : "Aucune de vos simulations n'a pu être évaluée pour le moment."
            }
          >
            <SessionTable sessions={insights.sessions} />
          </Panel>
        ) : (
          <Panel title="Analyses du Coach IA">
            <p className="text-sm leading-relaxed text-graphite">
              Aucune analyse n&apos;est encore enregistrée. Lancez une simulation : le compte rendu
              apparaîtra ici dès la fin de l&apos;analyse.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}
