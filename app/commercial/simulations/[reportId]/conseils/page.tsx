import type { Metadata } from "next";
import { CoachAdviceScreen } from "@/app/commercial/simulations/[reportId]/conseils/CoachAdviceScreen";

export const metadata: Metadata = {
  title: "Conseils du Coach",
  description:
    "Le plan de travail tiré de votre entretien : priorité, chronologie de l'appel et gestes à changer.",
};

export default async function CommercialAdvicePage({
  params,
}: PageProps<"/commercial/simulations/[reportId]/conseils">) {
  const { reportId } = await params;
  return <CoachAdviceScreen reportId={reportId} />;
}
