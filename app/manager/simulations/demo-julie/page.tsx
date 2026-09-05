import type { Metadata } from "next";
import { DEMO_SESSION_JULIE } from "@/src/data/demo-session-julie";
import { PageHeader } from "@/src/components/PageHeader";
import { SessionReportBody } from "@/src/components/SessionReportBody";
import { Panel } from "@/src/components/Panel";
import { Badge, DemoBadge, StatusBadge, TechnicalTestBadge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { formatDate } from "@/src/lib/format";

export const metadata: Metadata = {
  title: "Simulation : Validation voix Julie Français",
  description: "Vue manager du compte rendu de l'appel de validation technique.",
};

const REP_NAME = "Alexandre Jégo";

export default function ManagerCompteRenduDemoJuliePage() {
  const report = DEMO_SESSION_JULIE;

  return (
    <>
      <PageHeader
        eyebrow={`Compte rendu : ${formatDate(report.date)}`}
        title={report.title}
        description={`Simulation réalisée par ${REP_NAME}. Vue managériale du compte rendu produit par le Coach IA.`}
        back={{ href: "/manager/simulations", label: "Simulations" }}
        actions={
          <ButtonLink href="/manager/commerciaux/alexandre-jego" variant="secondary">
            Fiche du commercial
          </ButtonLink>
        }
        meta={
          <>
            <TechnicalTestBadge />
            <StatusBadge status={report.status} />
            <Badge tone="marque">{REP_NAME}</Badge>
          </>
        }
      />

      <SessionReportBody report={report} variant="manager" repName={REP_NAME} />

      <div className="mt-6">
        <Panel
          title="Commentaire du manager"
          description="Ce commentaire sera partagé avec le commercial dans une prochaine version."
          action={<DemoBadge>Bientôt disponible</DemoBadge>}
        >
          <label htmlFor="manager-comment" className="mb-2 block text-sm font-medium text-ink">
            Votre retour sur cette simulation
          </label>
          <textarea
            id="manager-comment"
            rows={4}
            disabled
            placeholder="La saisie de commentaires sera activée lors d'une prochaine étape."
            className="w-full cursor-not-allowed resize-none rounded-sm border border-line bg-mist/50 px-3.5 py-3 text-sm text-graphite placeholder:text-zinc-400"
          />
          <p className="mt-2 text-xs leading-relaxed text-graphite">
            Champ présenté à titre visuel : aucune donnée n&apos;est enregistrée.
          </p>
        </Panel>
      </div>
    </>
  );
}
