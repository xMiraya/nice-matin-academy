import type { Metadata } from "next";
import { DashboardScreen } from "@/app/commercial/DashboardScreen";

export const metadata: Metadata = {
  title: "Vue d'ensemble",
  description: "Tableau de bord d'entraînement du commercial.",
};

export default function CommercialDashboardPage() {
  return <DashboardScreen />;
}
