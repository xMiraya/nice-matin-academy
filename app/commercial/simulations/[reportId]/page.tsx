import type { Metadata } from "next";
import { CoachReportScreen } from "@/app/commercial/simulations/[reportId]/CoachReportScreen";

export const metadata: Metadata = {
  title: "Compte rendu de simulation",
  description: "Analyse détaillée de votre entretien avec Julie Dupont.",
};

export default async function CommercialReportPage({
  params,
}: PageProps<"/commercial/simulations/[reportId]">) {
  const { reportId } = await params;
  return <CoachReportScreen reportId={reportId} />;
}
