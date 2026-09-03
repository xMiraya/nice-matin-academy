import type { Metadata } from "next";
import { methodologySheets } from "@/src/data/methodology/sheets";
import { PageHeader } from "@/src/components/PageHeader";
import { ContentSheetList } from "@/app/manager/contenu/fiches/ContentSheetList";

export const metadata: Metadata = {
  title: "Fiches méthodologiques",
  description: "Modifier le contenu des fiches méthodologiques.",
};

export default function ManagerContentSheetsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contenu pédagogique"
        title="Fiches méthodologiques"
        description="Chaque publication remplace immédiatement ce que voient les commerciaux."
        back={{ href: "/manager/contenu", label: "Contenu pédagogique" }}
      />
      <ContentSheetList sheets={methodologySheets} />
    </>
  );
}
