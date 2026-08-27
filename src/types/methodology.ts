/**
 * Modele de donnees des fiches methodologiques.
 * Aucun contenu n'est ecrit dans les composants : tout vient de src/data.
 */

export type CompetencySlug =
  | 'premier-contact'
  | 'creation-relation'
  | 'decouverte-besoins'
  | 'presentation-offre'
  | 'gestion-objections'
  | 'communication'
  | 'creation-confiance'
  | 'conclusion';

/** Statut de relecture du contenu par l'equipe formation Nice-Matin. */
export type ValidationStatus = 'valide' | 'a-valider';

export const VALIDATION_LABEL = 'À VALIDER PAR L’ÉQUIPE FORMATION';

/** Une des quatre etapes de la methode : action, observation, adaptation, validation. */
export interface MethodStep {
  /** 1 a 4 */
  order: 1 | 2 | 3 | 4;
  /** Action / Observation / Adaptation / Validation */
  phase: 'Action' | 'Observation' | 'Adaptation' | 'Validation';
  /** Titre court commencant par un verbe d'action. */
  title: string;
  /** Une ligne, jamais un paragraphe. */
  detail: string;
}

/** Mini-cas terrain, volontairement tres court. */
export interface FieldScenario {
  context: string;
  prospectReaction: string;
  poorResponse: string;
  betterResponse: string;
  why: string;
}

export type MasteryLevelName = 'À travailler' | 'En progression' | 'Maîtrisé';

export interface MasteryLevel {
  name: MasteryLevelName;
  /** Comportement observable, pas un jugement. */
  behaviour: string;
}

export interface TrainerTip {
  text: string;
  validationStatus: ValidationStatus;
}

export interface Competency {
  id: CompetencySlug;
  number: number;
  slug: CompetencySlug;
  title: string;
  /** Phrase de definition affichee sur l'accueil et en en-tete de fiche. */
  definition: string;
}

export interface MethodologySheet extends Competency {
  /** Objectif principal, une ligne. */
  objective: string;
  /** Bloc 1 - trois puces maximum. */
  stakes: string[];
  /** Bloc 2 - exactement quatre etapes. */
  methodSteps: [MethodStep, MethodStep, MethodStep, MethodStep];
  /** Bloc 3 - 4 a 6 reflexes. */
  goodReflexes: string[];
  /** Bloc 4 - 3 a 5 formulations. */
  phrasesToUse: string[];
  /** Bloc 5 - 4 a 6 erreurs frequentes. */
  phrasesToAvoid: string[];
  /** Bloc 6 - 3 a 5 questions. */
  usefulQuestions: string[];
  /** Bloc 7 */
  fieldScenario: FieldScenario;
  /** Bloc 8 - 3 a 5 items. */
  checklist: string[];
  /** Bloc 9 - trois niveaux textuels, sans graphique. */
  masteryLevels: [MasteryLevel, MasteryLevel, MasteryLevel];
  /** Bloc 10 */
  trainerTip: TrainerTip;
  /** Statut global du contenu de la fiche. */
  validationStatus: ValidationStatus;
  /** Duree de lecture indicative, en minutes. */
  readingMinutes: number;
  /** Date de mise a jour (ISO court), affichee a l'impression. */
  updatedAt: string;
}
