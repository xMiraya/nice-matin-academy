import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { competencySlugs } from "@/src/data/methodology/competencies";
import { getSheet } from "@/src/data/methodology/sheets";
import { SheetEditorScreen } from "@/app/manager/contenu/fiches/[slug]/SheetEditorScreen";

export function generateStaticParams(): { slug: string }[] {
  return competencySlugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/manager/contenu/fiches/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const sheet = getSheet(slug);
  return { title: sheet ? `Modifier : ${sheet.title}` : "Fiche introuvable" };
}

export default async function ManagerSheetEditorPage({
  params,
}: PageProps<"/manager/contenu/fiches/[slug]">) {
  const { slug } = await params;
  const sheet = getSheet(slug);
  if (!sheet) notFound();
  return <SheetEditorScreen sheet={sheet} />;
}
