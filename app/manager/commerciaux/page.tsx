import type { Metadata } from "next";
import { CommerciauxScreen } from "@/app/manager/commerciaux/CommerciauxScreen";

export const metadata: Metadata = {
  title: "Commerciaux",
  description: "Suivi individuel des commerciaux.",
};

export default function CommerciauxPage() {
  return <CommerciauxScreen />;
}
