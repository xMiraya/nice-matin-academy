import type { Assessment, LevelId } from '@/src/types/qcm/quiz';

import { LEVEL_1 } from './level-1';
import { LEVEL_2 } from './level-2';
import { LEVEL_3 } from './level-3';
import { LEVEL_4 } from './level-4';
import { LEVEL_5 } from './level-5';

/** Les cinq evaluations transversales, ordonnees par niveau. */
export const ASSESSMENTS: readonly Assessment[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5];

export function getAssessmentByLevel(level: LevelId): Assessment {
  const found = ASSESSMENTS.find((a) => a.level === level);
  if (!found) throw new Error(`Evaluation inconnue pour le niveau ${level}`);
  return found;
}

export function findAssessmentByLevel(raw: string): Assessment | undefined {
  const level = Number(raw);
  return ASSESSMENTS.find((a) => a.level === level);
}

export function getAssessmentById(id: string): Assessment | undefined {
  return ASSESSMENTS.find((a) => a.id === id);
}

export { LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5 };
