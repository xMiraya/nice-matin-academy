import type { CompetencyId } from "@/src/types";
import type { CoachCompetencyScore } from "@/src/types/coach";

/**
 * Barème officiel du Coach Nice-Matin : huit compétences, poids totalisant 100.
 *
 * Les identifiants reprennent ceux du référentiel existant (`src/data/competencies.ts`)
 * afin que les radars, barres et cartes thermiques déjà en place fonctionnent sans
 * conversion supplémentaire.
 */
export interface CompetencyScaleEntry {
  id: CompetencyId;
  label: string;
  weight: number;
}

export const COACH_COMPETENCY_SCALE: CompetencyScaleEntry[] = [
  { id: "premier-contact", label: "Premier contact", weight: 12 },
  { id: "creation-relation", label: "Création de la relation", weight: 13 },
  { id: "decouverte-besoins", label: "Découverte des besoins", weight: 18 },
  { id: "presentation-offre", label: "Présentation de l'offre", weight: 15 },
  { id: "gestion-objections", label: "Gestion des objections", weight: 15 },
  { id: "communication", label: "Communication", weight: 10 },
  { id: "creation-confiance", label: "Gestion de la confiance", weight: 8 },
  { id: "conclusion", label: "Conclusion", weight: 9 },
];

export const COACH_COMPETENCY_IDS = COACH_COMPETENCY_SCALE.map((entry) => entry.id);

/** Somme des poids, vérifiée au chargement du module pour éviter toute dérive. */
export const TOTAL_WEIGHT = COACH_COMPETENCY_SCALE.reduce((sum, entry) => sum + entry.weight, 0);

if (TOTAL_WEIGHT !== 100) {
  throw new Error(`Barème du Coach invalide : total des poids = ${TOTAL_WEIGHT}, attendu 100.`);
}

/**
 * Recalcule la note globale à partir des huit notes sur 10.
 *
 * Le modèle propose les notes par compétence, mais la note globale est
 * systématiquement recalculée ici : elle n'est jamais reprise telle quelle
 * depuis la sortie du modèle.
 *
 * overallScore = Σ (note sur 10 × poids) / 10, arrondi à l'entier le plus proche.
 */
export function computeOverallScore(competencies: CoachCompetencyScore[]): number {
  const weighted = competencies.reduce((sum, competency) => {
    const score = clampInteger(competency.score, 0, 10);
    return sum + score * competency.weight;
  }, 0);

  return Math.round(weighted / 10);
}

export function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Libellé court associé à une note globale, utilisé si le modèle n'en fournit pas. */
export function defaultScoreInterpretation(score: number): string {
  if (score >= 80) return "Entretien maîtrisé";
  if (score >= 65) return "Bonne base, ajustements ciblés";
  if (score >= 50) return "Entretien perfectible";
  if (score >= 30) return "Fondamentaux à retravailler";
  return "Entretien à reprendre entièrement";
}
