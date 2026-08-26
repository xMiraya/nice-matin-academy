"use client";

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

      <div className="space-y-5">
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

        <Panel
          title="Appel de validation technique"
          description="Exclu du calcul de votre score moyen et de votre progression."
          action={<TechnicalTestBadge />}
        >
          <SessionTable sessions={[DEMO_COMMERCIAL_TECHNICAL_SESSION]} />
        </Panel>
      </div>
    </>
  );
}
