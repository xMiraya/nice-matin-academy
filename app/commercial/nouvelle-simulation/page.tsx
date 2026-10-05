import type { Metadata } from "next";
import { PageHeader } from "@/src/components/PageHeader";
import { SimulationSetup } from "@/app/commercial/nouvelle-simulation/SimulationSetup";
import { getCurrentUser } from "@/src/server/auth";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { JULIE_SIMULATION_ID, getAccessStatus } from "@/src/server/access/service";

export const metadata: Metadata = {
  title: "Nouvelle simulation",
  description: "Préparer une simulation d'entretien avec Julie Dupont.",
};

export default async function NouvelleSimulationPage({
  searchParams,
}: PageProps<"/commercial/nouvelle-simulation">) {
  const { acces } = await searchParams;
  const user = await getCurrentUser();

  // L'éligibilité est calculée ici, côté serveur, pour l'utilisateur de la session.
  // Un manager n'est pas soumis aux prérequis ; en cas d'erreur, le panneau
  // relit l'état lui-même et reste verrouillé tant qu'il n'a pas de réponse.
  let initialAccess;
  if (user) {
    initialAccess =
      user.role === "commercial"
        ? await getAccessStatus(user.profile.id, JULIE_SIMULATION_ID, pgAccessStore).catch(
            () => undefined,
          )
        : undefined;
  }

  return (
    <>
      <PageHeader
        image="/images/hero/simulation.jpg"
        eyebrow="Espace commercial"
        title="Préparer une simulation"
        description="Choisissez un niveau et un objectif pédagogique, vérifiez votre matériel, puis lancez l'entretien."
        back={{ href: "/commercial", label: "Vue d'ensemble" }}
      />
      <SimulationSetup
        initialAccess={initialAccess}
        notice={
          acces === "verrouille"
            ? "L'accès à Julie est verrouillé : les prérequis ne sont pas encore validés. Terminez les QCM et évaluations ci-dessous."
            : undefined
        }
      />
    </>
  );
}
