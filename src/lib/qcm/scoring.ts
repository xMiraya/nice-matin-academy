import { COMPETENCY_IDS } from '@/src/data/qcm/competencies';
import { IMPROVE_RATIO, MASTERY_BANDS, STRENGTH_RATIO } from '@/src/data/qcm/config';
import type { CompetencyId } from '@/src/types/qcm/competency';
import type {
  AnswerMap,
  AnswerValue,
  Assessment,
  AssessmentResult,
  CompetencyScore,
  MasteryBandId,
  Question,
  QuestionOutcome,
  QuestionResult,
} from '@/src/types/qcm/quiz';

/** Chaque question vaut 1 point, quel que soit son format. */
export const POINTS_PER_QUESTION = 1;

function isAnswered(value: AnswerValue | undefined): value is AnswerValue {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Note une question isolee.
 *
 * - choix unique / vrai-faux : tout ou rien.
 * - choix multiples : ratio (bonnes cochees - mauvaises cochees) / nb attendu,
 *   borne a [0, 1]. Le score ne peut donc jamais etre negatif.
 * - classement : ratio de positions correctes, tout-ou-rien evite car trop
 *   penalisant pedagogiquement ; le score partiel est explicite a la correction.
 */
export function gradeQuestion(question: Question, given: AnswerValue | undefined): QuestionResult {
  const base = { questionId: question.id, max: POINTS_PER_QUESTION, given: given ?? [] };

  if (!isAnswered(given)) {
    return { ...base, outcome: 'unanswered', earned: 0 };
  }

  if (question.kind === 'ordering') {
    const expected = question.correctOrder;
    const hits = expected.reduce(
      (acc, stepId, index) => (given[index] === stepId ? acc + 1 : acc),
      0,
    );
    const ratio = expected.length === 0 ? 0 : hits / expected.length;
    return { ...base, earned: ratio, outcome: outcomeFromRatio(ratio) };
  }

  const correctIds = question.options.filter((o) => o.correct).map((o) => o.id);
  const selected = new Set(given);

  if (question.kind !== 'multiple') {
    const ok = selected.size === 1 && correctIds.some((id) => selected.has(id));
    return { ...base, earned: ok ? 1 : 0, outcome: ok ? 'correct' : 'incorrect' };
  }

  const goodPicked = correctIds.filter((id) => selected.has(id)).length;
  const badPicked = given.filter((id) => !correctIds.includes(id)).length;
  const ratio =
    correctIds.length === 0 ? 0 : Math.max(0, (goodPicked - badPicked) / correctIds.length);

  return { ...base, earned: ratio, outcome: outcomeFromRatio(ratio) };
}

function outcomeFromRatio(ratio: number): QuestionOutcome {
  if (ratio >= 0.999) return 'correct';
  if (ratio > 0) return 'partial';
  return 'incorrect';
}

/** Agrege les resultats par competence principale. */
export function scoreByCompetency(
  questions: readonly Question[],
  results: readonly QuestionResult[],
): readonly CompetencyScore[] {
  const byId = new Map(results.map((r) => [r.questionId, r]));
  const acc = new Map<CompetencyId, { earned: number; max: number; count: number }>();
  for (const id of COMPETENCY_IDS) acc.set(id, { earned: 0, max: 0, count: 0 });

  for (const question of questions) {
    const bucket = acc.get(question.competency);
    if (!bucket) continue;
    const result = byId.get(question.id);
    bucket.earned += result?.earned ?? 0;
    bucket.max += POINTS_PER_QUESTION;
    bucket.count += 1;
  }

  return COMPETENCY_IDS.map((competency) => {
    const bucket = acc.get(competency) ?? { earned: 0, max: 0, count: 0 };
    return {
      competency,
      earned: round2(bucket.earned),
      max: bucket.max,
      ratio: bucket.max === 0 ? 0 : bucket.earned / bucket.max,
      questionCount: bucket.count,
    };
  });
}

export function bandForPercent(percent: number): MasteryBandId {
  let current: MasteryBandId = 'fondamentaux';
  for (const band of MASTERY_BANDS) {
    if (percent >= band.minPercent) current = band.id;
  }
  return current;
}

export function getBand(id: MasteryBandId) {
  const band = MASTERY_BANDS.find((b) => b.id === id);
  if (!band) throw new Error(`Bande de maitrise inconnue : ${id}`);
  return band;
}

/** Note une evaluation complete et produit la restitution. */
export function gradeAssessment(
  assessment: Assessment,
  answers: AnswerMap,
  options: { readonly durationSeconds: number; readonly resultId: string; readonly completedAt?: string },
): AssessmentResult {
  const perQuestion = assessment.questions.map((q) => gradeQuestion(q, answers[q.id]));
  const earned = perQuestion.reduce((sum, r) => sum + r.earned, 0);
  const max = perQuestion.length * POINTS_PER_QUESTION;
  const percent = max === 0 ? 0 : Math.round((earned / max) * 100);
  const perCompetency = scoreByCompetency(assessment.questions, perQuestion);

  const answered = perCompetency.filter((c) => c.questionCount > 0);
  const strengths = [...answered]
    .filter((c) => c.ratio >= STRENGTH_RATIO)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3)
    .map((c) => c.competency);
  const toImprove = [...answered]
    .filter((c) => c.ratio < IMPROVE_RATIO)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3)
    .map((c) => c.competency);

  return {
    id: options.resultId,
    assessmentId: assessment.id,
    level: assessment.level,
    completedAt: options.completedAt ?? new Date().toISOString(),
    durationSeconds: Math.max(0, Math.round(options.durationSeconds)),
    earned: round2(earned),
    max,
    percent,
    band: bandForPercent(percent),
    correctCount: perQuestion.filter((r) => r.outcome === 'correct').length,
    partialCount: perQuestion.filter((r) => r.outcome === 'partial').length,
    incorrectCount: perQuestion.filter((r) => r.outcome === 'incorrect').length,
    unansweredCount: perQuestion.filter((r) => r.outcome === 'unanswered').length,
    perQuestion,
    perCompetency,
    strengths,
    toImprove,
  };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Formate une duree en texte lisible, sans notion de compte a rebours. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes === 0) return `${rest} s`;
  return `${minutes} min ${String(rest).padStart(2, '0')} s`;
}
