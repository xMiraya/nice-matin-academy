import type {
  AccessEventInput,
  AccessStore,
  RequirementInput,
} from "@/src/server/access/service";
import { DEFAULT_THRESHOLD, withTitles } from "@/src/server/access/service";
import type { AccessOverride, Attempt, Requirement } from "@/src/server/access/eligibility";
import type { QuestionPatchLike } from "@/src/lib/qcm/effective";

/** Magasin en mémoire : mêmes contrats que PostgreSQL, sans base. */
export function createFakeStore() {
  const state = {
    threshold: DEFAULT_THRESHOLD,
    requirements: [] as Requirement[],
    attempts: [] as Attempt[],
    overrides: [] as (AccessOverride & { simulationId: string })[],
    patches: new Map<string, QuestionPatchLike>(),
    events: [] as AccessEventInput[],
    failReads: false,
  };
  let counter = 0;

  const store: AccessStore = {
    async getThreshold() {
      if (state.failReads) throw new Error("db down");
      return state.threshold;
    },
    async setThreshold(value) {
      state.threshold = value;
    },
    async getRequirements() {
      return state.requirements;
    },
    async replaceRequirements(_sim, items: RequirementInput[]) {
      state.requirements = withTitles(items.map((item) => ({ ...item, id: `r${++counter}` })));
    },
    async getAttempts(userId) {
      return state.attempts.filter((a) => a.userId === userId);
    },
    async saveAttempt(attempt) {
      state.attempts.push({
        userId: attempt.userId,
        kind: attempt.kind,
        targetId: attempt.targetId,
        score: attempt.score,
      });
    },
    async getOverrides(userId, simulationId) {
      return state.overrides.filter((o) => o.userId === userId && o.simulationId === simulationId);
    },
    async createOverride(input) {
      const created = {
        id: `o${++counter}`,
        userId: input.userId,
        simulationId: input.simulationId,
        reason: input.reason,
        grantedBy: input.grantedBy,
        grantedAt: new Date().toISOString(),
        expiresAt: input.expiresAt,
        revokedAt: null,
      };
      state.overrides.push(created);
      return created;
    },
    async revokeOverride(id) {
      const found = state.overrides.find((o) => o.id === id && !o.revokedAt);
      if (!found) return null;
      found.revokedAt = new Date().toISOString();
      return found;
    },
    async getPublishedQuestionPatches() {
      return state.patches;
    },
    async logEvent(event) {
      state.events.push(event);
    },
    async logEventOnce(event: AccessEventInput) {
      const exists = state.events.some(
        (e) => e.type === event.type && e.userId === event.userId && e.simulationId === event.simulationId,
      );
      if (!exists) state.events.push(event);
      return !exists;
    },
  };
  return { store, state };
}

export function requirement(
  kind: Requirement["kind"],
  targetId: string,
  extra: Partial<Requirement> = {},
): Requirement {
  return {
    id: `${kind}-${targetId}`,
    kind,
    targetId,
    title: `${kind} ${targetId}`,
    requiredScore: null,
    active: true,
    ...extra,
  };
}
