import type { Metadata } from "next";
import { SimulationsScreen } from "@/app/commercial/simulations/SimulationsScreen";

export const metadata: Metadata = {
  title: "Mes simulations",
  description: "Historique des simulations réalisées.",
};

export default function MesSimulationsPage() {
  return <SimulationsScreen />;
}
