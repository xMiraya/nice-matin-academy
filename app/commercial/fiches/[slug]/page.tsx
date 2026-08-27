import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MethodologySheetView } from "@/src/components/methodology/MethodologySheetView";
import { competencySlugs } from "@/src/data/methodology/competencies";
import { getSheet, getSheetNeighbours } from "@/src/data/methodology/sheets";

/** Les huit routes sont générées statiquement au build. */
export function generateStaticParams(): { slug: string }[] {
  return competencySlugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/commercial/fiches/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const sheet = getSheet(slug);
  if (!sheet) return { title: "Fiche introuvable" };
  return {
    title: `${sheet.number}. ${sheet.title}`,
    description: sheet.definition,
  };
}

export default async function SheetPage({ params }: PageProps<"/commercial/fiches/[slug]">) {
  const { slug } = await params;
  const sheet = getSheet(slug);
  if (!sheet) notFound();

  const { previous, next } = getSheetNeighbours(slug);
  return <MethodologySheetView sheet={sheet} previous={previous} next={next} />;
}
