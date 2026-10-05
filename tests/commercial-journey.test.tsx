import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { JulieAccessPanel } from "@/src/components/access/JulieAccessPanel";
import type { JulieAccess } from "@/src/lib/access/julie-access";
import {
  checkSimulationEligibility,
  submitAttempt,
  updateRequirements,
} from "@/src/server/access/service";
import { createFakeStore } from "./fake-store";

const manager = { id: "m1", role: "manager" as const };
const level1 = ASSESSMENTS.find((a) => a.id === "niveau-1")!;

/** Réponses justes pour les `good` premières questions, fausses pour les autres. */
function answersWith(good: number) {
  const out: Record<string, string[]> = {};
  level1.questions.forEach((q, index) => {
    const ok = index < good;
    if (q.kind === "ordering") {
      out[q.id] = ok ? [...q.correctOrder] : [...q.correctOrder].reverse();
    } else {
      const wanted = q.options.filter((o) => o.correct === ok).map((o) => o.id);
      out[q.id] = q.kind === "multiple" ? wanted : wanted.slice(0, 1);
    }
  });
  return out;
}

const attempt = (answers: Record<string, string[]>) => ({
  kind: "ASSESSMENT" as const,
  targetId: "niveau-1",
  answers,
  durationSeconds: 0,
});

async function setup() {
  const { store, state } = createFakeStore();
  await updateRequirements(
    manager,
    "julie",
    [
      { kind: "QUIZ", targetId: "c1-prise-de-contact", requiredScore: null, active: true },
      { kind: "QUIZ", targetId: "c6-objections", requiredScore: null, active: true },
      { kind: "ASSESSMENT", targetId: "niveau-1", requiredScore: null, active: true },
    ],
    store,
  );
  return { store, state };
}

describe("parcours d'un commercial", () => {
  it("exemple 95 / 87 / 94 : verrouillé, puis déverrouillé automatiquement après une nouvelle tentative", async () => {
    const { store, state } = await setup();
    const push = (kind: "QUIZ" | "ASSESSMENT", targetId: string, score: number) =>
      state.attempts.push({ userId: "alice", kind, targetId, score });

    push("QUIZ", "c1-prise-de-contact", 95);
    push("QUIZ", "c6-objections", 87);
    push("ASSESSMENT", "niveau-1", 94);

    const locked = await checkSimulationEligibility("alice", "julie", store);
    expect(locked.eligible).toBe(false);
    expect(locked.passedCount).toBe(2);
    expect(locked.totalCount).toBe(3);

    // Le commercial recommence le QCM 2 et obtient 91 : le meilleur score est conservé.
    push("QUIZ", "c6-objections", 91);
    push("QUIZ", "c6-objections", 60);
    const unlocked = await checkSimulationEligibility("alice", "julie", store);
    expect(unlocked.eligible).toBe(true);
    expect(unlocked.requirements.find((r) => r.targetId === "c6-objections")?.bestScore).toBe(91);
  });

  it("11. déverrouillage via une vraie tentative corrigée par le serveur", async () => {
    const { store, state } = await setup();
    // Les deux QCM sont déjà validés par ailleurs.
    state.attempts.push(
      { userId: "alice", kind: "QUIZ", targetId: "c1-prise-de-contact", score: 100 },
      { userId: "alice", kind: "QUIZ", targetId: "c6-objections", score: 100 },
    );
    await submitAttempt("alice", attempt(answersWith(0)), store);
    expect((await checkSimulationEligibility("alice", "julie", store)).eligible).toBe(false);
    await submitAttempt("alice", attempt(answersWith(level1.questions.length)), store);
    expect((await checkSimulationEligibility("alice", "julie", store)).eligible).toBe(true);
  });

  it("8. les résultats d'une collègue ne déverrouillent pas Julie", async () => {
    const { store, state } = await setup();
    for (const [kind, targetId] of [
      ["QUIZ", "c1-prise-de-contact"],
      ["QUIZ", "c6-objections"],
      ["ASSESSMENT", "niveau-1"],
    ] as const) {
      state.attempts.push({ userId: "bob", kind, targetId, score: 100 });
    }
    expect((await checkSimulationEligibility("bob", "julie", store)).eligible).toBe(true);
    expect((await checkSimulationEligibility("alice", "julie", store)).eligible).toBe(false);
  });
});

describe("affichage de la carte « Simulation avec Julie »", () => {
  const locked: JulieAccess = {
    eligible: false,
    requiredScore: 90,
    message:
      "Vous devez obtenir au moins 90/100 à chaque QCM et évaluation obligatoire avant de pouvoir vous entraîner avec Julie.",
    passedCount: 1,
    totalCount: 3,
    viaOverride: false,
    override: null,
    requirements: [
      { title: "QCM découverte client", type: "QUIZ", targetId: "c3-decouverte-des-besoins", completed: true, bestScore: 95, requiredScore: 90, passed: true },
      { title: "QCM traitement des objections", type: "QUIZ", targetId: "c6-objections", completed: true, bestScore: 82, requiredScore: 90, passed: false },
      { title: "Évaluation finale", type: "ASSESSMENT", targetId: "niveau-5", completed: false, bestScore: null, requiredScore: 90, passed: false },
    ],
  };

  it("12. verrouillée : titre, seuil, progression, scores et liens de reprise", () => {
    const html = renderToStaticMarkup(<JulieAccessPanel state={{ status: "ready", access: locked }} onRetry={() => {}} />);
    expect(html).toContain("Simulation avec Julie verrouillée");
    expect(html).toContain("au moins 90/100");
    expect(html).toContain("Progression : 1 prérequis validé sur 3");
    expect(html).toContain("95/100 — Validé");
    expect(html).toContain("82/100 — À recommencer");
    expect(html).toContain("Non réalisé");
    expect(html).toContain("/commercial/qcm/entrainement/c6-objections");
    expect(html).toContain("/commercial/qcm/evaluations/5");
  });

  it("12b. déverrouillée : message de réussite", () => {
    const open: JulieAccess = {
      ...locked,
      eligible: true,
      passedCount: 3,
      message: "Vous avez validé tous les prérequis. Vous pouvez maintenant commencer votre simulation.",
    };
    const html = renderToStaticMarkup(<JulieAccessPanel state={{ status: "ready", access: open }} onRetry={() => {}} />);
    expect(html).toContain("Julie est débloquée");
    expect(html).toContain("Vous pouvez maintenant commencer votre simulation");
    expect(html).not.toContain("verrouillée");
  });

  it("gère le chargement et l'erreur sans jamais débloquer", () => {
    expect(renderToStaticMarkup(<JulieAccessPanel state={{ status: "loading" }} onRetry={() => {}} />)).toContain("Vérification");
    expect(renderToStaticMarkup(<JulieAccessPanel state={{ status: "error" }} onRetry={() => {}} />)).toContain("reste bloqué");
  });
});
