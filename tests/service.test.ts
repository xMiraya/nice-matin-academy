import { describe, expect, it } from "vitest";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import {
  cancelOverride,
  checkSimulationEligibility,
  getAccessStatus,
  grantOverride,
  submitAttempt,
  updateRequirements,
  updateThreshold,
} from "@/src/server/access/service";
import { createFakeStore } from "./fake-store";

const manager = { id: "m1", role: "manager" as const };
const commercial = { id: "u1", role: "commercial" as const };
const level1 = ASSESSMENTS.find((a) => a.id === "niveau-1")!;
const REQ = [{ kind: "ASSESSMENT" as const, targetId: "niveau-1", requiredScore: null, active: true }];

/** Réponses entièrement justes (`true`) ou entièrement fausses (`false`). */
function answers(correct: boolean) {
  const out: Record<string, string[]> = {};
  for (const q of level1.questions) {
    if (q.kind === "ordering") {
      out[q.id] = correct ? [...q.correctOrder] : [...q.correctOrder].reverse();
    } else {
      const wanted = q.options.filter((o) => o.correct === correct).map((o) => o.id);
      out[q.id] = q.kind === "multiple" ? wanted : wanted.slice(0, 1);
    }
  }
  return out;
}

const attemptInput = (a: Record<string, string[]>) => ({
  kind: "ASSESSMENT" as const,
  targetId: "niveau-1",
  answers: a,
  durationSeconds: 0,
});

describe("correction côté serveur", () => {
  it("note 100 pour toutes les bonnes réponses et 0 sans réponse", async () => {
    const { store, state } = createFakeStore();
    await submitAttempt("u1", attemptInput(answers(true)), store);
    await submitAttempt("u1", attemptInput({}), store);
    expect(state.attempts.map((a) => a.score)).toEqual([100, 0]);
  });

  it("8. plusieurs tentatives : une mauvaise tentative ultérieure n'annule pas la meilleure", async () => {
    const { store, state } = createFakeStore();
    await updateRequirements(manager, "julie", REQ, store);
    await submitAttempt("u1", attemptInput(answers(true)), store);
    await submitAttempt("u1", attemptInput(answers(false)), store);
    expect(state.attempts).toHaveLength(2);
    expect((await checkSimulationEligibility("u1", "julie", store)).eligible).toBe(true);
  });

  it("rejette une cible inconnue et des réponses étrangères au QCM", async () => {
    const { store } = createFakeStore();
    const unknown = await submitAttempt(
      "u1",
      { kind: "ASSESSMENT", targetId: "niveau-99", answers: {}, durationSeconds: 0 },
      store,
    );
    const foreign = await submitAttempt("u1", attemptInput({ "question-inventee": ["a"] }), store);
    expect(unknown.ok).toBe(false);
    expect(foreign.ok).toBe(false);
  });

  it("n'accepte jamais un score envoyé par le navigateur", async () => {
    const { store, state } = createFakeStore();
    const forged = { ...attemptInput({}), score: 100, percent: 100 };
    await submitAttempt("u1", forged as never, store);
    expect(state.attempts[0].score).toBe(0);
  });

  it("applique les corrections publiées par le manager", async () => {
    const { store, state } = createFakeStore();
    const q = level1.questions.find((x) => x.kind === "single");
    if (!q || q.kind !== "single") throw new Error("question de test introuvable");
    const wrong = q.options.find((o) => !o.correct)!;
    state.patches.set(q.id, {
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        rationale: o.rationale,
        correct: o.id === wrong.id,
      })),
    });
    await submitAttempt("u1", attemptInput({ [q.id]: [wrong.id] }), store);
    expect(state.attempts[0].score).toBeGreaterThan(0);
  });
});

describe("seuil configurable", () => {
  it("14. le manager change le seuil : journalisé, et la règle suit", async () => {
    const { store, state } = createFakeStore();
    await updateRequirements(manager, "julie", REQ, store);
    state.attempts.push({ userId: "u1", kind: "ASSESSMENT", targetId: "niveau-1", score: 85 });
    expect((await checkSimulationEligibility("u1", "julie", store)).eligible).toBe(false);

    await updateThreshold(manager, 80, store);
    expect(state.threshold).toBe(80);
    expect(state.events.at(-1)).toMatchObject({ type: "THRESHOLD_CHANGED", details: { from: 90, to: 80 } });
    expect((await checkSimulationEligibility("u1", "julie", store)).eligible).toBe(true);
  });

  it("valide le seuil côté serveur (entier de 0 à 100)", async () => {
    const { store } = createFakeStore();
    for (const bad of [-1, 101, 89.5, "abc", null]) {
      await expect(updateThreshold(manager, bad, store)).rejects.toThrow();
    }
    await expect(updateThreshold(manager, 0, store)).resolves.toBe(0);
    await expect(updateThreshold(manager, 100, store)).resolves.toBe(100);
  });

  it("refuse un commercial", async () => {
    const { store, state } = createFakeStore();
    await expect(updateThreshold(commercial, 10, store)).rejects.toThrow("Accès refusé.");
    expect(state.threshold).toBe(90);
  });
});

describe("dérogations et journal", () => {
  it("exige un motif, interdit le commercial, accepte puis annule", async () => {
    const { store, state } = createFakeStore();
    await updateRequirements(manager, "julie", REQ, store);
    await expect(grantOverride(manager, "julie", { userId: "u1", reason: "" }, store)).rejects.toThrow();
    await expect(
      grantOverride(commercial, "julie", { userId: "u1", reason: "Je veux Julie" }, store),
    ).rejects.toThrow("Accès refusé.");

    const granted = await grantOverride(
      manager,
      "julie",
      { userId: "u1", reason: "Rattrapage validé en présentiel" },
      store,
    );
    expect((await checkSimulationEligibility("u1", "julie", store)).viaOverride).toBe(true);
    expect(state.events.at(-1)).toMatchObject({ type: "OVERRIDE_GRANTED", actorId: "m1" });

    expect(await cancelOverride(manager, granted.id, store)).toBe(true);
    expect((await checkSimulationEligibility("u1", "julie", store)).eligible).toBe(false);
    expect(await cancelOverride(manager, granted.id, store)).toBe(false);
  });

  it("refuse une expiration dans le passé", async () => {
    const { store } = createFakeStore();
    await expect(
      grantOverride(
        manager,
        "julie",
        { userId: "u1", reason: "Test passé", expiresAt: "2020-01-01T00:00:00Z" },
        store,
      ),
    ).rejects.toThrow();
  });

  it("journalise le déverrouillage une seule fois malgré plusieurs affichages", async () => {
    const { store, state } = createFakeStore();
    await updateRequirements(manager, "julie", REQ, store);
    state.attempts.push({ userId: "u1", kind: "ASSESSMENT", targetId: "niveau-1", score: 95 });
    await getAccessStatus("u1", "julie", store);
    await getAccessStatus("u1", "julie", store);
    await getAccessStatus("u1", "julie", store);
    expect(state.events.filter((e) => e.type === "UNLOCKED")).toHaveLength(1);
  });
});
