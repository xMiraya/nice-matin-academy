import type { CompetencyId } from './competency';
import type { AnswerMap, AssessmentResult, LevelId } from './quiz';

/** Trace d'un entrainement cible termine. */
export interface TrainingRecord {
  readonly competency: CompetencyId;
  readonly completedAt: string;
  readonly correct: number;
  readonly total: number;
}

/** Session d'evaluation en cours, permettant la reprise apres interruption. */
export interface AssessmentSession {
  readonly assessmentId: string;
  readonly level: LevelId;
  readonly startedAt: string;
  /** Secondes deja ecoulees, cumulees entre les reprises. */
  readonly elapsedSeconds: number;
  readonly answers: AnswerMap;
  readonly currentIndex: number;
}

export interface UserProgress {
  /** Version du schema, pour migrer proprement la persistance locale. */
  readonly version: 1;
  readonly trainings: readonly TrainingRecord[];
  readonly results: readonly AssessmentResult[];
  /** Sessions non terminees, indexees par identifiant d'evaluation. */
  readonly openSessions: Readonly<Record<string, AssessmentSession>>;
}

/**
 * Abstraction de persistance. La V1 fournit une implementation localStorage.
 * Une V2 pourra brancher une base de donnees INDEPENDANTE derriere la meme
 * interface, sans toucher a l'interface utilisateur.
 */
export interface ProgressStore {
  load(): UserProgress;
  save(progress: UserProgress): void;
  clear(): void;
}
