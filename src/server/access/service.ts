import { z } from "zod";
import { COMPETENCIES } from "@/src/data/qcm/competencies";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { evaluate, unauthenticatedResult } from "@/src/server/access/eligibility";
import type {
  AccessOverride,
  Attempt,
  EligibilityResult,
  Requirement,
  RequirementKind,
} from "@/src/server/access/eligibility";
import { gradeAttempt, questionsForTarget } from "@/src/server/access/grading";
import type { QuestionPatchLike } from "@/src/lib/qcm/effective";

/** Seule simulation existante aujourd'hui : l'entretien avec Julie. */
export const JULIE_SIMULATION_ID = "julie";
export const SIMULATION_IDS = [JULIE_SIMULATION_ID] as const;
export const DEFAULT_THRESHOLD = 90;

export type AccessEventType =
  | "UNLOCKED"
  | "FIRST_ACCESS"
  | "ACCESS_DENIED"
  | "OVERRIDE_GRANTED"
  | "OVERRIDE_REVOKED"
  | "THRESHOLD_CHANGED"
  | "REQUIREMENTS_CHANGED";

export interface AccessEventInput {
  type: AccessEventType;
  userId: string | null;
  actorId?: string | null;
  simulationId: string;
  details?: Record<string, unknown>;
}

export interface RequirementInput {
  kind: RequirementKind;
  targetId: string;
  requiredScore: number | null;
  active: boolean;
}

/** Accès aux données : implémenté en PostgreSQL, remplaçable dans les tests. */
export interface AccessStore {
  getThreshold(): Promise<number>;
  setThreshold(value: number, actorId: string): Promise<void>;
  getRequirements(simulationId: string): Promise<Requirement[]>;
  replaceRequirements(simulationId: string, items: RequirementInput[]): Promise<void>;
  getAttempts(userId: string): Promise<Attempt[]>;
  saveAttempt(attempt: {
    userId: string;
    kind: RequirementKind;
    targetId: string;
    score: number;
    earned: number;
    max: number;
    durationSeconds: number;
    answers: Record<string, readonly string[]>;
  }): Promise<void>;
  getOverrides(userId: string, simulationId: string): Promise<AccessOverride[]>;
  createOverride(input: {
    userId: string;
    simulationId: string;
    reason: string;
    grantedBy: string;
    expiresAt: string | null;
  }): Promise<AccessOverride>;
  /** Renvoie la dérogation annulée, ou `null` si elle n'existe pas ou l'était déjà. */
  revokeOverride(id: string, actorId: string): Promise<(AccessOverride & { simulationId: string }) | null>;
  getPublishedQuestionPatches(): Promise<Map<string, QuestionPatchLike>>;
  logEvent(event: AccessEventInput): Promise<void>;
  /** Journalise une seule fois par (utilisateur, simulation, type). */
  logEventOnce(event: AccessEventInput): Promise<boolean>;
}

export function targetTitle(kind: RequirementKind, targetId: string): string {
  if (kind === "ASSESSMENT") {
    const found = ASSESSMENTS.find((a) => a.id === targetId);
    return found ? `Évaluation : ${found.title}` : `Évaluation ${targetId}`;
  }
  const found = COMPETENCIES.find((c) => c.id === targetId);
  return found ? `QCM : ${found.label}` : `QCM ${targetId}`;
}

export function withTitles(
  rows: { id: string; kind: RequirementKind; targetId: string; requiredScore: number | null; active: boolean }[],
): Requirement[] {
  return rows.map((row) => ({ ...row, title: targetTitle(row.kind, row.targetId) }));
}

/**
 * Fonction centrale : tout accès à une simulation payante passe par elle.
 * Elle relit seuil, prérequis, tentatives et dérogations dans la base ; aucun
 * score ni autorisation fournis par le navigateur n'est pris en compte.
 */
export async function checkSimulationEligibility(
  userId: string | null | undefined,
  simulationId: string,
  store: AccessStore,
  now: Date = new Date(),
): Promise<EligibilityResult> {
  const threshold = await store.getThreshold();
  if (!userId) return unauthenticatedResult(threshold);
  const [requirements, attempts, overrides] = await Promise.all([
    store.getRequirements(simulationId),
    store.getAttempts(userId),
    store.getOverrides(userId, simulationId),
  ]);
  return evaluate({ userId, threshold, requirements, attempts, overrides, now });
}

/** Statut pour l'affichage : journalise le déverrouillage la première fois seulement. */
export async function getAccessStatus(
  userId: string,
  simulationId: string,
  store: AccessStore,
): Promise<EligibilityResult> {
  const result = await checkSimulationEligibility(userId, simulationId, store);
  if (result.eligible && !result.viaOverride && result.totalCount > 0) {
    await store.logEventOnce({
      type: "UNLOCKED",
      userId,
      simulationId,
      details: { requirements: result.requirements.map((r) => ({ title: r.title, bestScore: r.bestScore })) },
    });
  }
  return result;
}

/** Journalise un refus avec les prérequis manquants (jamais à l'affichage simple). */
export async function recordDenied(
  userId: string,
  simulationId: string,
  result: EligibilityResult,
  store: AccessStore,
): Promise<void> {
  await store.logEvent({
    type: "ACCESS_DENIED",
    userId,
    simulationId,
    details: {
      missing: result.requirements
        .filter((r) => !r.passed)
        .map((r) => ({ title: r.title, completed: r.completed, bestScore: r.bestScore, requiredScore: r.requiredScore })),
    },
  });
}

export async function recordFirstAccess(userId: string, simulationId: string, store: AccessStore) {
  return store.logEventOnce({ type: "FIRST_ACCESS", userId, simulationId });
}

/* ------------------------------------------------------------------ */
/* Tentatives                                                          */
/* ------------------------------------------------------------------ */

export const AttemptSchema = z.object({
  kind: z.enum(["QUIZ", "ASSESSMENT"]),
  targetId: z.string().min(1).max(80),
  answers: z.record(z.string().max(80), z.array(z.string().max(80)).max(40)),
  durationSeconds: z.number().int().min(0).max(86_400).default(0),
});

export type AttemptResult =
  | { ok: true; score: number }
  | { ok: false; status: 400; error: string };

/** Corrige une tentative côté serveur et l'enregistre ; le meilleur score se déduit de l'historique. */
export async function submitAttempt(
  userId: string,
  input: z.infer<typeof AttemptSchema>,
  store: AccessStore,
): Promise<AttemptResult> {
  if (!questionsForTarget(input.kind, input.targetId)) {
    return { ok: false, status: 400, error: "Évaluation ou QCM inconnu." };
  }
  const overrides = await store.getPublishedQuestionPatches();
  const graded = gradeAttempt({
    kind: input.kind,
    targetId: input.targetId,
    answers: input.answers,
    overrides,
  });
  if (!graded.ok) return { ok: false, status: 400, error: graded.error };
  await store.saveAttempt({
    userId,
    kind: input.kind,
    targetId: input.targetId,
    score: graded.score,
    earned: graded.earned,
    max: graded.max,
    durationSeconds: input.durationSeconds,
    answers: input.answers,
  });
  return { ok: true, score: graded.score };
}

/* ------------------------------------------------------------------ */
/* Administration                                                      */
/* ------------------------------------------------------------------ */

export interface Actor {
  id: string;
  role: "manager" | "commercial";
}

export class ForbiddenError extends Error {}
export class ValidationError extends Error {}

function assertManager(actor: Actor) {
  if (actor.role !== "manager") throw new ForbiddenError("Accès refusé.");
}

const ThresholdSchema = z.number().int().min(0).max(100);

export async function updateThreshold(actor: Actor, value: unknown, store: AccessStore): Promise<number> {
  assertManager(actor);
  const parsed = ThresholdSchema.safeParse(value);
  if (!parsed.success) throw new ValidationError("Le seuil doit être un entier compris entre 0 et 100.");
  const previous = await store.getThreshold();
  if (previous === parsed.data) return previous;
  await store.setThreshold(parsed.data, actor.id);
  await store.logEvent({
    type: "THRESHOLD_CHANGED",
    userId: null,
    actorId: actor.id,
    simulationId: JULIE_SIMULATION_ID,
    details: { from: previous, to: parsed.data },
  });
  return parsed.data;
}

const RequirementsSchema = z
  .array(
    z.object({
      kind: z.enum(["QUIZ", "ASSESSMENT"]),
      targetId: z.string().min(1).max(80),
      requiredScore: z.number().min(0).max(100).nullable(),
      active: z.boolean(),
    }),
  )
  .max(50);

export async function updateRequirements(
  actor: Actor,
  simulationId: string,
  value: unknown,
  store: AccessStore,
): Promise<void> {
  assertManager(actor);
  if (!(SIMULATION_IDS as readonly string[]).includes(simulationId)) {
    throw new ValidationError("Simulation inconnue.");
  }
  const parsed = RequirementsSchema.safeParse(value);
  if (!parsed.success) throw new ValidationError("Prérequis invalides.");
  const seen = new Set<string>();
  for (const item of parsed.data) {
    if (!questionsForTarget(item.kind, item.targetId)) {
      throw new ValidationError("Un prérequis désigne un QCM ou une évaluation inexistant.");
    }
    const key = `${item.kind}:${item.targetId}`;
    if (seen.has(key)) throw new ValidationError("Un prérequis est présent en double.");
    seen.add(key);
  }
  const before = await store.getRequirements(simulationId);
  await store.replaceRequirements(simulationId, parsed.data);
  await store.logEvent({
    type: "REQUIREMENTS_CHANGED",
    userId: null,
    actorId: actor.id,
    simulationId,
    details: {
      before: before.map((r) => `${r.kind}:${r.targetId}`),
      after: parsed.data.map((r) => `${r.kind}:${r.targetId}${r.active ? "" : " (inactif)"}`),
    },
  });
}

const OverrideSchema = z.object({
  userId: z.string().min(1).max(80),
  reason: z.string().trim().min(5, "Indiquez un motif (5 caractères minimum).").max(500),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function grantOverride(
  actor: Actor,
  simulationId: string,
  value: unknown,
  store: AccessStore,
  now: Date = new Date(),
): Promise<AccessOverride> {
  assertManager(actor);
  const parsed = OverrideSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Dérogation invalide.");
  }
  const expiresAt = parsed.data.expiresAt ?? null;
  if (expiresAt && Date.parse(expiresAt) <= now.getTime()) {
    throw new ValidationError("La date d'expiration doit être dans le futur.");
  }
  const created = await store.createOverride({
    userId: parsed.data.userId,
    simulationId,
    reason: parsed.data.reason,
    grantedBy: actor.id,
    expiresAt,
  });
  await store.logEvent({
    type: "OVERRIDE_GRANTED",
    userId: parsed.data.userId,
    actorId: actor.id,
    simulationId,
    details: { reason: parsed.data.reason, expiresAt },
  });
  return created;
}

export async function cancelOverride(actor: Actor, id: string, store: AccessStore): Promise<boolean> {
  assertManager(actor);
  const revoked = await store.revokeOverride(id, actor.id);
  if (!revoked) return false;
  await store.logEvent({
    type: "OVERRIDE_REVOKED",
    userId: revoked.userId,
    actorId: actor.id,
    simulationId: revoked.simulationId,
    details: { overrideId: id },
  });
  return true;
}
