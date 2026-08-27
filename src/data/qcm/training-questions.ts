import type { CompetencyId } from '@/src/types/qcm/competency';
import type { Question } from '@/src/types/qcm/quiz';

import { C1_TRAINING } from './training/c1-prise-de-contact';
import { C2_TRAINING } from './training/c2-ecoute-active';
import { C3_TRAINING } from './training/c3-decouverte';
import { C4_TRAINING } from './training/c4-reformulation';
import { C5_TRAINING } from './training/c5-argumentation';
import { C6_TRAINING } from './training/c6-objections';
import { C7_TRAINING } from './training/c7-posture';
import { C8_TRAINING } from './training/c8-conclusion';

/**
 * Banque d'entrainement cible : 15 questions par competence, 120 au total.
 * Chaque session tire aleatoirement un sous-ensemble (voir TRAINING_SAMPLE_SIZE).
 */
export const TRAINING_QUESTIONS: Readonly<Record<CompetencyId, readonly Question[]>> = {
  'c1-prise-de-contact': C1_TRAINING,
  'c2-ecoute-active': C2_TRAINING,
  'c3-decouverte-des-besoins': C3_TRAINING,
  'c4-reformulation': C4_TRAINING,
  'c5-argumentation': C5_TRAINING,
  'c6-objections': C6_TRAINING,
  'c7-posture': C7_TRAINING,
  'c8-conclusion': C8_TRAINING,
};

export const ALL_TRAINING_QUESTIONS: readonly Question[] =
  Object.values(TRAINING_QUESTIONS).flat();

export function trainingQuestionsFor(competency: CompetencyId): readonly Question[] {
  return TRAINING_QUESTIONS[competency];
}
