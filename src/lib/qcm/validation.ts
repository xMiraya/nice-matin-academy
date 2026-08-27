import { z } from 'zod';
import { COMPETENCY_IDS } from '@/src/data/qcm/competencies';
import type { Question } from '@/src/types/qcm/quiz';

const competencyId = z.enum(COMPETENCY_IDS as unknown as [string, ...string[]]);
const level = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const answerOption = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  correct: z.boolean(),
  rationale: z.string().min(1, 'Chaque option doit expliquer pourquoi elle convient ou non.'),
});

const base = {
  id: z.string().min(1),
  level,
  competency: competencyId,
  secondaryCompetency: competencyId.optional(),
  scenario: z.string().optional(),
  prompt: z.string().min(1),
  explanation: z.string().min(1),
  fieldTip: z.string().min(1),
  source: z.string().min(1),
  needsNiceMatinReview: z.boolean().optional(),
};

const choiceQuestion = z
  .object({
    ...base,
    kind: z.enum(['single', 'multiple', 'true-false']),
    options: z.array(answerOption).min(2),
  })
  .superRefine((q, ctx) => {
    const correct = q.options.filter((o) => o.correct).length;
    if (q.kind === 'multiple' && correct < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${q.id} : une question a choix multiples doit avoir au moins deux bonnes reponses.`,
      });
    }
    if (q.kind !== 'multiple' && correct !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${q.id} : une question a choix unique doit avoir exactement une bonne reponse.`,
      });
    }
  });

const orderingQuestion = z
  .object({
    ...base,
    kind: z.literal('ordering'),
    steps: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(3),
    correctOrder: z.array(z.string().min(1)).min(3),
  })
  .superRefine((q, ctx) => {
    const stepIds = new Set(q.steps.map((s) => s.id));
    if (q.correctOrder.length !== q.steps.length || q.correctOrder.some((id) => !stepIds.has(id))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${q.id} : correctOrder doit contenir exactement une fois chaque etape.`,
      });
    }
  });

export const questionSchema = z.union([choiceQuestion, orderingQuestion]);
export const questionBankSchema = z.array(questionSchema);

/**
 * Valide une banque de questions et signale les identifiants dupliques.
 * Utilise par les tests unitaires : la banque est statique, il n'y a donc
 * aucune validation a executer en production.
 */
export function validateBank(questions: readonly Question[], label: string): void {
  const parsed = questionBankSchema.safeParse(questions);
  if (!parsed.success) {
    throw new Error(`${label} : ${parsed.error.issues.map((i) => i.message).join(' | ')}`);
  }
  const seen = new Set<string>();
  for (const question of questions) {
    if (seen.has(question.id)) throw new Error(`${label} : identifiant duplique ${question.id}`);
    seen.add(question.id);
  }
}
