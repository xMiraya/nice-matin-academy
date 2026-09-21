import type { Metadata } from "next";
import { ProgressionScreen } from "@/app/commercial/progression/ProgressionScreen";

export const metadata: Metadata = {
  title: "Progression",
  description: "Évolution des compétences commerciales dans le temps.",
};

export default function ProgressionPage() {
  return <ProgressionScreen />;
}
