import type { Metadata } from "next";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { TeamMemberList } from "@/src/components/TeamMemberList";
import { SkillsHeatmap } from "@/src/components/SkillsHeatmap";

export const metadata: Metadata = {
  title: "Commerciaux",
  description: "Suivi individuel des commerciaux.",
};

export default function CommerciauxPage() {
  const data = DEMO_MANAGER_DASHBOARD;

  return (
    <>
      <PageHeader
        eyebrow="Espace manager"
        title="Commerciaux"
        description="Niveau, régularité et priorité pédagogique de chaque commercial. Seule la fiche d'Alexandre Jégo est détaillée dans cette maquette."
      />

      <div className="space-y-6">
        <Panel title="Équipe" description={`${data.repsCount} commerciaux suivis.`}>
          <TeamMemberList members={data.members} />
        </Panel>

        <Panel title="Vue par compétence" description="Carte thermique commerciaux × compétences.">
          <SkillsHeatmap members={data.members} />
        </Panel>
      </div>
    </>
  );
}
