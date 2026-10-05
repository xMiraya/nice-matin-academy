import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CallRoom } from "@/app/commercial/appel/CallRoom";
import { getCurrentUser } from "@/src/server/auth";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { JULIE_SIMULATION_ID, checkSimulationEligibility } from "@/src/server/access/service";

export const metadata: Metadata = {
  title: "Simulation en cours",
  description: "Entretien simulé avec Julie Dupont.",
};

export default async function AppelPage() {
  const user = await getCurrentUser();
  // Garde d'affichage : la vraie barrière reste la route de création Tavus.
  if (user?.role === "commercial") {
    const eligibility = await checkSimulationEligibility(
      user.profile.id,
      JULIE_SIMULATION_ID,
      pgAccessStore,
    );
    if (!eligibility.eligible) redirect("/commercial/nouvelle-simulation");
  }
  return <CallRoom />;
}
