import type { Metadata } from "next";
import { ManagerRapportsScreen } from "@/app/manager/rapports/RapportsScreen";

export const metadata: Metadata = {
  title: "Rapports",
  description: "Synthèses périodiques du dispositif d'entraînement.",
};

export default function ManagerRapportsPage() {
  return <ManagerRapportsScreen />;
}
