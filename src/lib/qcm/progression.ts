import { PROGRESSION_MODE, STORAGE_NAMESPACE, UNLOCK_THRESHOLD_PERCENT } from '@/src/data/qcm/config';
import type { CompetencyId } from '@/src/types/qcm/competency';
import type { AssessmentSession, ProgressStore, TrainingRecord, UserProgress } from '@/src/types/qcm/progress';
import type { AssessmentResult, LevelId } from '@/src/types/qcm/quiz';

export const EMPTY_PROGRESS: UserProgress = {
  version: 1,
  trainings: [],
  results: [],
  openSessions: {},
};

const STORAGE_KEY = `${STORAGE_NAMESPACE}.progress`;

/** Implementation localStorage de l'abstraction de persistance. */
export function createLocalProgressStore(): ProgressStore {
  const available = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  return {
    load() {
      if (!available) return EMPTY_PROGRESS;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return EMPTY_PROGRESS;
        const parsed = JSON.parse(raw) as Partial<UserProgress>;
        if (parsed.version !== 1) return EMPTY_PROGRESS;
        return {
          version: 1,
          trainings: parsed.trainings ?? [],
          results: parsed.results ?? [],
          openSessions: parsed.openSessions ?? {},
        };
      } catch {
        // Donnees corrompues : on repart d'une progression vierge plutot que
        // de bloquer l'utilisateur.
        return EMPTY_PROGRESS;
      }
    },
    save(progress) {
      if (!available) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch {
        /* quota depasse ou mode prive : la session continue sans persistance. */
      }
    },
    clear() {
      if (!available) return;
      window.localStorage.removeItem(STORAGE_KEY);
    },
  };
}

export function addTraining(progress: UserProgress, record: TrainingRecord): UserProgress {
  return { ...progress, trainings: [...progress.trainings, record] };
}

export function addResult(progress: UserProgress, result: AssessmentResult): UserProgress {
  const openSessions = { ...progress.openSessions };
  delete openSessions[result.assessmentId];
  return { ...progress, results: [...progress.results, result], openSessions };
}

export function upsertSession(progress: UserProgress, session: AssessmentSession): UserProgress {
  return {
    ...progress,
    openSessions: { ...progress.openSessions, [session.assessmentId]: session },
  };
}

export function dropSession(progress: UserProgress, assessmentId: string): UserProgress {
  const openSessions = { ...progress.openSessions };
  delete openSessions[assessmentId];
  return { ...progress, openSessions };
}

export function resultsFor(progress: UserProgress, assessmentId: string): readonly AssessmentResult[] {
  return progress.results.filter((r) => r.assessmentId === assessmentId);
}

export function bestPercent(progress: UserProgress, assessmentId: string): number | null {
  const scores = resultsFor(progress, assessmentId).map((r) => r.percent);
  return scores.length === 0 ? null : Math.max(...scores);
}

export function lastResult(progress: UserProgress, assessmentId?: string): AssessmentResult | null {
  const pool = assessmentId ? resultsFor(progress, assessmentId) : progress.results;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => a.completedAt.localeCompare(b.completedAt))[pool.length - 1] ?? null;
}

/**
 * Determine si une evaluation est accessible.
 * En mode "libre" (defaut pilote) tout est ouvert.
 */
export function isLevelUnlocked(progress: UserProgress, level: LevelId): boolean {
  if (PROGRESSION_MODE === 'libre') return true;
  if (level === 1) return true;
  const previousId = `niveau-${level - 1}`;
  const best = bestPercent(progress, previousId);
  return best !== null && best >= UNLOCK_THRESHOLD_PERCENT;
}

/** Competences deja travaillees en entrainement cible. */
export function trainedCompetencies(progress: UserProgress): readonly CompetencyId[] {
  return [...new Set(progress.trainings.map((t) => t.competency))];
}

/** Moyenne des ratios par competence sur l'ensemble des evaluations passees. */
export function competencyAverages(progress: UserProgress): Readonly<Record<string, number>> {
  const acc: Record<string, { earned: number; max: number }> = {};
  for (const result of progress.results) {
    for (const score of result.perCompetency) {
      if (score.max === 0) continue;
      const bucket = (acc[score.competency] ??= { earned: 0, max: 0 });
      bucket.earned += score.earned;
      bucket.max += score.max;
    }
  }
  return Object.fromEntries(
    Object.entries(acc).map(([id, { earned, max }]) => [id, max === 0 ? 0 : earned / max]),
  );
}
