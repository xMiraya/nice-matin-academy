import type { Metadata } from "next";
import { CallRoom } from "@/app/commercial/appel/CallRoom";

export const metadata: Metadata = {
  title: "Simulation en cours",
  description: "Entretien simulé avec Julie Dupont.",
};

export default function AppelPage() {
  return <CallRoom />;
}
