import type { CompetencyId } from './competency';

/** Niveaux de difficulte, alignes sur les cinq evaluations transversales. */
export type LevelId = 1 | 2 | 3 | 4 | 5;

/** Formats de questions supportes par le moteur. */
export type QuestionKind =
  /** Une seule bonne reponse parmi N. */
  | 'single'
  /** Plusieurs bonnes reponses, annoncees explicitement a l'utilisateur. */
  | 'multiple'
  /** Vrai / Faux avec justification a choisir. */
  | 'true-false'
  /** Remise en ordre d'etapes ou d'un dialogue (alternative clavier obligatoire). */
  | 'ordering';

export interface AnswerOption {
  /** Identifiant unique dans la question. */
  readonly id: string;
  /** Libelle affiche. */
  readonly label: string;
  /** true si l'option fait partie de la bonne reponse. */
  readonly correct: boolean;
  /** Pourquoi cette option est (ou n'est pas) adaptee. Affiche a la correction. */
  readonly rationale: string;
}

interface QuestionBase {
  readonly id: string;
  readonly level: LevelId;
  readonly competency: CompetencyId;
  readonly secondaryCompetency?: CompetencyId;
  /** Contexte / mise en situation facultative, affichee avant l'enonce. */
  readonly scenario?: string;
  /** Enonce de la question. */
  readonly prompt: string;
  /** Explication pedagogique globale, affichee a la correction. */
  readonly explanation: string;
  /** Conseil directement applicable sur le terrain. */
  readonly fieldTip: string;
  /** Source pedagogique, ou mention "A valider par Nice-Matin". */
  readonly source: string;
  /** true si la question porte sur une offre / un tarif / une procedure a valider. */
  readonly needsNiceMatinReview?: boolean;
}

export interface ChoiceQuestion extends QuestionBase {
  readonly kind: 'single' | 'multiple' | 'true-false';
  readonly options: readonly AnswerOption[];
}

export interface OrderingQuestion extends QuestionBase {
  readonly kind: 'ordering';
  /** Elements a remettre dans l'ordre, presentes melanges a l'ecran. */
  readonly steps: readonly { readonly id: string; readonly label: string }[];
  /** Ordre attendu, exprime en identifiants d'etapes. */
  readonly correctOrder: readonly string[];
}

export type Question = ChoiceQuestion | OrderingQuestion;

/** Reponse utilisateur : ids d'options selectionnees, ou ordre propose. */
export type AnswerValue = readonly string[];

/** Table des reponses d'une session, indexee par identifiant de question. */
export type AnswerMap = Readonly<Record<string, AnswerValue>>;

export interface Assessment {
  readonly id: string;
  readonly level: LevelId;
  readonly title: string;
  readonly kicker: string;
  readonly levelLabel: string;
  readonly objective: string;
  readonly description: string;
  /** Duree indicative en minutes (informative, sans compte a rebours). */
  readonly indicativeMinutes: number;
  readonly questions: readonly Question[];
}

/** Score obtenu sur une competence donnee. */
export interface CompetencyScore {
  readonly competency: CompetencyId;
  readonly earned: number;
  readonly max: number;
  /** Ratio 0 -> 1. Vaut 0 si max === 0. */
  readonly ratio: number;
  readonly questionCount: number;
}

export type QuestionOutcome = 'correct' | 'partial' | 'incorrect' | 'unanswered';

export interface QuestionResult {
  readonly questionId: string;
  readonly outcome: QuestionOutcome;
  readonly earned: number;
  readonly max: number;
  readonly given: AnswerValue;
}

export type MasteryBandId =
  | 'fondamentaux'
  | 'fragile'
  | 'operationnel'
  | 'bonne-maitrise'
  | 'avancee';

export interface MasteryBand {
  readonly id: MasteryBandId;
  /** Seuil minimal inclus, exprime en pourcentage (0 a 100). */
  readonly minPercent: number;
  readonly label: string;
  /** Message de restitution, encourageant et professionnel. */
  readonly message: string;
}

export interface AssessmentResult {
  readonly id: string;
  readonly assessmentId: string;
  readonly level: LevelId;
  /** Date ISO de fin d'evaluation. */
  readonly completedAt: string;
  /** Temps passe en secondes (informatif). */
  readonly durationSeconds: number;
  readonly earned: number;
  readonly max: number;
  /** Pourcentage arrondi a l'entier, 0 a 100. */
  readonly percent: number;
  readonly band: MasteryBandId;
  readonly correctCount: number;
  readonly partialCount: number;
  readonly incorrectCount: number;
  readonly unansweredCount: number;
  readonly perQuestion: readonly QuestionResult[];
  readonly perCompetency: readonly CompetencyScore[];
  readonly strengths: readonly CompetencyId[];
  readonly toImprove: readonly CompetencyId[];
}

export interface Recommendation {
  readonly kind: 'training' | 'assessment' | 'method';
  readonly title: string;
  readonly reason: string;
  readonly href: string;
}
