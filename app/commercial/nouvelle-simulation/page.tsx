import type { Metadata } from "next";
import { PageHeader } from "@/src/components/PageHeader";
import { SimulationSetup } from "@/app/commercial/nouvelle-simulation/SimulationSetup";

export const metadata: Metadata = {
  title: "Nouvelle simulation",
  description: "Préparer une simulation d'entretien avec Julie Dupont.",
};

export default function NouvelleSimulationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Préparer une simulation"
        description="Choisissez un niveau et un objectif pédagogique, vérifiez votre matériel, puis lancez l'entretien."
        back={{ href: "/commercial", label: "Vue d'ensemble" }}
      />
      <SimulationSetup />
    </>
  );
}
