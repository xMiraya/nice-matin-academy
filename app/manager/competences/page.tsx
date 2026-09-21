import type { Metadata } from "next";
import { ManagerCompetencesScreen } from "@/app/manager/competences/CompetencesScreen";

export const metadata: Metadata = {
  title: "Compétences",
  description: "Niveau de l'équipe sur les huit compétences commerciales.",
};

export default function ManagerCompetencesPage() {
  return <ManagerCompetencesScreen />;
}
