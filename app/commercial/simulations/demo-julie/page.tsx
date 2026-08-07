import type { Metadata } from "next";
import { DEMO_SESSION_JULIE } from "@/src/data/demo-session-julie";
import { DEMO_COMMERCIAL_PROFILE } from "@/src/data/demo-commercial";
import { PageHeader } from "@/src/components/PageHeader";
import { SessionReportBody } from "@/src/components/SessionReportBody";
import { Badge, StatusBadge, TechnicalTestBadge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { formatDate } from "@/src/lib/format";

export const metadata: Metadata = {
  title: "Compte rendu — Validation voix Julie Français",
  description: "Compte rendu détaillé de l'appel de validation technique réalisé avec Julie Dupont.",
};

export default function CompteRenduDemoJuliePage() {
  const report = DEMO_SESSION_JULIE;

  return (
    <>
      <PageHeader
        eyebrow={`Compte rendu — ${formatDate(report.date)}`}
        title={report.title}
        description="Analyse produite par le Coach IA à partir du transcript, du comportement observé et des réactions de Julie."
        back={{ href: "/commercial/simulations", label: "Mes simulations" }}
        actions={
          <ButtonLink href="/commercial/nouvelle-simulation" variant="secondary">
            Nouvelle simulation
          </ButtonLink>
        }
        meta={
          <>
            <TechnicalTestBadge />
            <StatusBadge status={report.status} />
            <Badge tone="marque">{report.characterName}</Badge>
          </>
        }
      />

      <SessionReportBody
        report={report}
        variant="commercial"
        repName={`${DEMO_COMMERCIAL_PROFILE.firstName} ${DEMO_COMMERCIAL_PROFILE.lastName}`}
      />
    </>
  );
}
