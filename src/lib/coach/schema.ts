import { z } from "zod";
import { COACH_COMPETENCY_IDS } from "@/src/lib/coach/competency-scale";

/**
 * Schéma de sortie structurée du Coach.
 *
 * Les sorties structurées OpenAI ne prennent pas en charge les contraintes de
 * longueur de chaîne ni de cardinalité de tableau. Ces limites sont donc
 * demandées dans le prompt puis **imposées côté serveur** lors de la
 * normalisation, ce qui évite qu'une analyse entière soit perdue parce qu'une
 * phrase dépasse de quelques caractères.
 */

const competencyIdEnum = z.enum(COACH_COMPETENCY_IDS as [string, ...string[]]);

export const CoachEvidenceSchema = z.object({
  timestampSeconds: z.number(),
  speaker: z.enum(["commercial", "julie"]),
  excerpt: z.string(),
});

export const CoachCompetencySchema = z.object({
  id: competencyIdEnum,
  score: z.number(),
  observation: z.string(),
  evidence: z.array(CoachEvidenceSchema),
});

export const CoachHighlightSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  timestampSeconds: z.number().nullable(),
});

export const CoachNextActionSchema = z.object({
  title: z.string(),
  instruction: z.string(),
});

export const CoachKeyMomentSchema = z.object({
  timestampSeconds: z.number(),
  type: z.enum(["positive", "warning", "objection", "turning_point", "conclusion"]),
  title: z.string(),
  explanation: z.string(),
});

export const CoachMissedOpportunitySchema = z.object({
  timestampSeconds: z.number().nullable(),
  title: z.string(),
  explanation: z.string(),
});

export const CoachPsychologicalStateSchema = z.object({
  confidence: z.number(),
  interest: z.number(),
  understanding: z.number(),
  perceivedValue: z.number(),
  feltPressure: z.number(),
});

/** Ce que le modèle doit produire. Le score global n'en fait volontairement pas partie. */
export const CoachModelOutputSchema = z.object({
  outcome: z.enum(["accepted", "refused", "postponed", "interrupted", "inconclusive"]),
  outcomeLabel: z.string(),
  scoreInterpretation: z.string(),
  competencies: z.array(CoachCompetencySchema),
  psychologicalState: CoachPsychologicalStateSchema,
  strengths: z.array(CoachHighlightSchema),
  improvements: z.array(CoachHighlightSchema),
  nextActions: z.array(CoachNextActionSchema),
  keyMoments: z.array(CoachKeyMomentSchema),
  missedOpportunities: z.array(CoachMissedOpportunitySchema),
  commercialSummary: z.string(),
  managerSummary: z.string(),
  pedagogicalPriority: z.object({
    competencyId: competencyIdEnum,
    reason: z.string(),
  }),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  limitations: z.array(z.string()),
});

export type CoachModelOutput = z.infer<typeof CoachModelOutputSchema>;
