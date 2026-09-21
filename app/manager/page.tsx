import type { Metadata } from "next";
import { ManagerDashboardScreen } from "@/app/manager/DashboardScreen";

export const metadata: Metadata = {
  title: "Vue équipe",
  description: "Tableau de bord de la direction commerciale.",
};

export default function ManagerDashboardPage() {
  return <ManagerDashboardScreen />;
}
