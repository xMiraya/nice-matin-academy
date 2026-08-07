import type { Metadata } from "next";
import { ManagerReportScreen } from "@/app/manager/simulations/[reportId]/ManagerReportScreen";

export const metadata: Metadata = {
  title: "Compte rendu de simulation",
  description: "Vue managériale de l'analyse produite par le Coach IA.",
};

export default async function ManagerReportPage({
  params,
}: PageProps<"/manager/simulations/[reportId]">) {
  const { reportId } = await params;
  return <ManagerReportScreen reportId={reportId} />;
}
