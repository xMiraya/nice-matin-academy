import type { Metadata } from "next";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/StatusBadge";
import { ProgressDashboard } from "@/src/components/qcm/ProgressDashboard";
import { qcmRoutes } from "@/src/data/qcm/routes";

export const metadata: Metadata = {
  title: "Progression QCM",
  description: "Moyenne par compétence, historique des passages et recommandations.",
};

export default function QcmProgressionPage() {
  return (
    <>
      <PageHeader
        eyebrow="Entraînement QCM"
        title="Ma progression sur les QCM"
        description="Ces informations sont enregistrées uniquement dans ce navigateur. Elles ne sont ni transmises, ni partagées, et aucune comparaison entre commerciaux n’est effectuée."
        back={{ href: qcmRoutes.home, label: "Entraînement QCM" }}
        meta={<Badge tone="neutre">Données locales à cet appareil</Badge>}
      />
      <ProgressDashboard />
    </>
  );
}
