import { describe, expect, it } from "vitest";
import { evaluate } from "@/src/server/access/eligibility";
import type { AccessOverride, Attempt } from "@/src/server/access/eligibility";
import { checkSimulationEligibility } from "@/src/server/access/service";
import { createFakeStore, requirement } from "./fake-store";

const NOW = new Date("2026-10-05T12:00:00Z");
const quiz = requirement("QUIZ", "c1-prise-de-contact");
const evalu = requirement("ASSESSMENT", "niveau-1");
const attempt = (score: number, extra: Partial<Attempt> = {}): Attempt => ({
  userId: "u1",
  kind: "ASSESSMENT",
  targetId: "niveau-1",
  score,
  ...extra,
});
const base = { userId: "u1", threshold: 90, overrides: [] as AccessOverride[], now: NOW };

describe("règle d'éligibilité", () => {
  it("2. refuse un utilisateur sans aucune tentative", () => {
    const r = evaluate({ ...base, requirements: [quiz, evalu], attempts: [] });
    expect(r.eligible).toBe(false);
    expect(r.requirements.every((s) => !s.completed)).toBe(true);
  });

  it("3. refuse quand un QCM n'est pas terminé", () => {
    const r = evaluate({ ...base, requirements: [quiz, evalu], attempts: [attempt(95)] });
    expect(r.eligible).toBe(false);
    expect(r.requirements.find((s) => s.type === "QUIZ")?.completed).toBe(false);
  });

  it("4. refuse quand une évaluation n'est pas terminée", () => {
    const r = evaluate({
      ...base,
      requirements: [quiz, evalu],
      attempts: [attempt(95, { kind: "QUIZ", targetId: quiz.targetId })],
    });
    expect(r.eligible).toBe(false);
    expect(r.requirements.find((s) => s.type === "ASSESSMENT")?.completed).toBe(false);
  });

  it("5. refuse 89/100", () => {
    const r = evaluate({ ...base, requirements: [evalu], attempts: [attempt(89)] });
    expect(r.eligible).toBe(false);
    expect(r.requirements[0]).toMatchObject({ completed: true, bestScore: 89, passed: false });
  });

  it("6. accepte exactement 90/100", () => {
    expect(evaluate({ ...base, requirements: [evalu], attempts: [attempt(90)] }).eligible).toBe(true);
  });

  it("7. accepte plus de 90/100", () => {
    expect(evaluate({ ...base, requirements: [evalu], attempts: [attempt(97.5)] }).eligible).toBe(true);
  });

  it("8. conserve le meilleur score parmi plusieurs tentatives", () => {
    const r = evaluate({
      ...base,
      requirements: [evalu],
      attempts: [attempt(60), attempt(92), attempt(70)],
    });
    expect(r.requirements[0].bestScore).toBe(92);
    expect(r.eligible).toBe(true);
  });

  it("9. une moyenne supérieure à 90 ne compense pas un prérequis inférieur", () => {
    // 100 et 85 : moyenne 92,5, mais l'évaluation reste sous le seuil.
    const r = evaluate({
      ...base,
      requirements: [quiz, evalu],
      attempts: [attempt(100, { kind: "QUIZ", targetId: quiz.targetId }), attempt(85)],
    });
    expect(r.eligible).toBe(false);
    expect(r.passedCount).toBe(1);
  });

  it("10. ignore les résultats d'un autre compte", () => {
    const r = evaluate({
      ...base,
      requirements: [evalu],
      attempts: [attempt(100, { userId: "autre-utilisateur" })],
    });
    expect(r.eligible).toBe(false);
    expect(r.requirements[0].completed).toBe(false);
  });

  it("applique un seuil propre au prérequis", () => {
    const strict = requirement("ASSESSMENT", "niveau-1", { requiredScore: 95 });
    expect(evaluate({ ...base, requirements: [strict], attempts: [attempt(92)] }).eligible).toBe(false);
  });

  it("ignore un prérequis inactif", () => {
    const off = requirement("ASSESSMENT", "niveau-1", { active: false });
    expect(evaluate({ ...base, requirements: [off], attempts: [] }).eligible).toBe(true);
  });
});

describe("dérogations", () => {
  const override = (extra: Partial<AccessOverride> = {}): AccessOverride => ({
    id: "o1",
    userId: "u1",
    reason: "Formation hors plateforme",
    grantedBy: "m1",
    grantedAt: "2026-10-01T00:00:00Z",
    expiresAt: null,
    revokedAt: null,
    ...extra,
  });

  it("12. une dérogation valide ouvre l'accès sans scores", () => {
    const r = evaluate({ ...base, requirements: [evalu], attempts: [], overrides: [override()] });
    expect(r.eligible).toBe(true);
    expect(r.viaOverride).toBe(true);
  });

  it("12b. une dérogation à expiration future reste valide", () => {
    const r = evaluate({
      ...base,
      requirements: [evalu],
      attempts: [],
      overrides: [override({ expiresAt: "2026-12-01T00:00:00Z" })],
    });
    expect(r.eligible).toBe(true);
  });

  it("13. une dérogation expirée est ignorée", () => {
    const r = evaluate({
      ...base,
      requirements: [evalu],
      attempts: [],
      overrides: [override({ expiresAt: "2026-10-02T00:00:00Z" })],
    });
    expect(r.eligible).toBe(false);
  });

  it("13b. une dérogation annulée est ignorée", () => {
    const r = evaluate({
      ...base,
      requirements: [evalu],
      attempts: [],
      overrides: [override({ revokedAt: "2026-10-03T00:00:00Z" })],
    });
    expect(r.eligible).toBe(false);
  });

  it("une dérogation d'un autre utilisateur ne compte pas", () => {
    const r = evaluate({
      ...base,
      requirements: [evalu],
      attempts: [],
      overrides: [override({ userId: "u2" })],
    });
    expect(r.eligible).toBe(false);
  });
});

describe("fonction centrale checkSimulationEligibility", () => {
  it("1. un utilisateur non identifié n'est jamais éligible", async () => {
    const { store } = createFakeStore();
    expect((await checkSimulationEligibility(null, "julie", store)).eligible).toBe(false);
  });

  it("relit les tentatives de la base pour le bon utilisateur uniquement", async () => {
    const { store, state } = createFakeStore();
    state.requirements = [evalu];
    state.attempts = [attempt(95, { userId: "u2" })];
    expect((await checkSimulationEligibility("u1", "julie", store)).eligible).toBe(false);
    expect((await checkSimulationEligibility("u2", "julie", store)).eligible).toBe(true);
  });
});
