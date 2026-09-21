import type { Metadata } from "next";
import { MemberScreen } from "@/app/manager/commerciaux/[slug]/MemberScreen";

export const metadata: Metadata = {
  title: "Fiche commercial",
  description: "Fiche de suivi individuelle.",
};

export default async function ManagerMemberPage({
  params,
}: PageProps<"/manager/commerciaux/[slug]">) {
  const { slug } = await params;
  return <MemberScreen slug={slug} />;
}
