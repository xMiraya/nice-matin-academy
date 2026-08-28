"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DEMO_COMMERCIAL_SESSIONS,
  DEMO_COMMERCIAL_TECHNICAL_SESSION,
} from "@/src/data/demo-commercial";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { SessionTable } from "@/src/components/SessionTable";
import { ButtonLink } from "@/src/components/Button";
import { Badge, DemoBadge, TechnicalTestBadge } from "@/src/components/StatusBadge";
import { useReports } from "@/src/lib/reports/use-reports";
import { computeReportInsights } from "@/src/lib/reports/report-insights";

/** Historique des simulations : analyses réelles d'abord, démonstration ensuite. */
export function SimulationsScreen() {
  const reports = useReports();
  const insights = computeReportInsights(reports, "/commercial/simulations");
  // Le compte rendu le plus récent, mis en avant pour éviter de le chercher
  // dans le tableau après chaque simulation.
  const latest = insights.sessions[0];

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Mes simulations"
        description="Vos analyses réelles, puis l'historique de démonstration conservé pour illustrer l'interface."
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
            {latest.score} / 100
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            Ouvrir le compte rendu
            <ArrowRight size={15} aria-hidden />
          </span>
        </Link>
      ) : null}

      <div className="space-y-5 pb-2">
        {insights.hasReports ? (
          <Panel
            title="Analyses du Coach IA"
            description={`Moyenne de vos analyses réelles : ${insights.averageScore} / 100.`}
          >
            <SessionTable sessions={insights.sessions} />
          </Panel>
        ) : (
          <Panel title="Analyses du Coach IA">
            <p className="text-sm leading-relaxed text-graphite">
              Aucune analyse réelle n&apos;est encore enregistrée sur cet appareil. Lancez une
              simulation : le compte rendu apparaîtra ici dès la fin de l&apos;analyse.
            </p>
          </Panel>
        )}

        <Panel
          title="Historique de démonstration"
          description="Données fictives conservées pour la présentation de l'interface."
          action={<DemoBadge />}
        >
          <SessionTable sessions={DEMO_COMMERCIAL_SESSIONS} />
        </Panel>

        {/*
          Séparé du reste par un trait : c'est une vérification d'ingénierie,
          pas un repère de progression, et la page ne doit pas s'arrêter net
          juste après le tableau.
        */}
        <div className="border-t border-line pt-5">
          <Panel
            title="Appel de validation technique"
            description="Exclu du calcul de votre score moyen et de votre progression."
            action={<TechnicalTestBadge />}
          >
            <SessionTable sessions={[DEMO_COMMERCIAL_TECHNICAL_SESSION]} />
          </Panel>
        </div>
      </div>
    </>
  );
}
