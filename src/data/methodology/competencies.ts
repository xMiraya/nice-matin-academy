import { COMPETENCIES } from "@/src/data/competencies";
import type { Competency, CompetencySlug } from "@/src/types/methodology";

/**
 * Les huit compétences des fiches sont exactement celles évaluées par le
 * Coach IA : elles sont dérivées de `src/data/competencies.ts`, qui reste la
 * source de vérité unique de l'application. Ne pas réordonner sans validation
 * de l'équipe formation.
 */
export const competencies: readonly Competency[] = COMPETENCIES.map((competency, index) => ({
  id: competency.id as CompetencySlug,
  slug: competency.id as CompetencySlug,
  number: index + 1,
  title: competency.label,
  definition: competency.description,
}));

export const competencySlugs: readonly CompetencySlug[] = competencies.map((c) => c.slug);

export function getCompetency(slug: string): Competency | undefined {
  return competencies.find((c) => c.slug === slug);
}
