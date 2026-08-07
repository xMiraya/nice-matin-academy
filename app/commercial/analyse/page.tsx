import type { Metadata } from "next";
import { AnalysisProgress } from "@/app/commercial/analyse/AnalysisProgress";

export const metadata: Metadata = {
  title: "Analyse en cours",
  description: "Traitement de l'entretien par le Coach IA.",
};

export default function AnalysePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center py-6">
      <AnalysisProgress />
    </div>
  );
}
