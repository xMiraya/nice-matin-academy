/**
 * Modele de donnees des huit competences commerciales.
 * Ce fichier ne contient QUE des types : les contenus vivent dans src/data.
 */

/** Identifiants stables des huit competences. Ne jamais les renumeroter. */
export type CompetencyId =
  | 'c1-prise-de-contact'
  | 'c2-ecoute-active'
  | 'c3-decouverte-des-besoins'
  | 'c4-reformulation'
  | 'c5-argumentation'
  | 'c6-objections'
  | 'c7-posture'
  | 'c8-conclusion';

export interface Competency {
  /** Identifiant stable, egalement utilise comme segment d'URL. */
  readonly id: CompetencyId;
  /** Numero d'affichage (1 a 8). */
  readonly order: number;
  /** Titre court affiche dans les listes et les graphiques. */
  readonly shortLabel: string;
  /** Titre complet. */
  readonly label: string;
  /** Surtitre en capitales affiche au-dessus du titre. */
  readonly kicker: string;
  /** Explication pedagogique courte (2 a 4 phrases). */
  readonly summary: string;
  /** Objectifs pedagogiques de la competence. */
  readonly objectives: readonly string[];
  /** Comportements attendus sur le terrain. */
  readonly expectedBehaviours: readonly string[];
  /** Erreurs frequentes a eviter. */
  readonly commonMistakes: readonly string[];
  /** Source pedagogique ou mention de validation requise. */
  readonly source: string;
}
