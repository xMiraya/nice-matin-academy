import type { Metadata } from "next";
import { ManagerSimulationsScreen } from "@/app/manager/simulations/SimulationsScreen";

export const metadata: Metadata = {
  title: "Simulations",
  description: "Suivi des simulations réalisées par l'équipe.",
};

export default function ManagerSimulationsPage() {
  return <ManagerSimulationsScreen />;
}
