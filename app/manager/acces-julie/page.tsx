import type { Metadata } from "next";
import { AccessScreen } from "@/app/manager/acces-julie/AccessScreen";

export const metadata: Metadata = {
  title: "Accès à Julie",
  description: "Prérequis, seuil et dérogations pour la simulation avec Julie.",
};

export default function AccesJuliePage() {
  return <AccessScreen />;
}
