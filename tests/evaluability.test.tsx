import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { CoachReport } from "@/src/types/coach";
import type { UserProfile } from "@/src/types";
import { COACH_COMPETENCY_SCALE } from "@/src/lib/coach/competency-scale";
import {
  MIN_COMMERCIAL_WORDS,
  evaluateTranscriptEligibility,
  evaluatedReports,
  reportEvaluability,
} from "@/src/lib/coach/evaluability";
import { buildHistorySummaries } from "@/src/lib/coach/history";
import { buildNonEvaluableReport } from "@/src/lib/coach/analyze-conversation";
import { competencyDeltas, computeReportInsights, weeklyStreak } from "@/src/lib/reports/report-insights";
import { buildManagerDashboard, buildTeamMember } from "@/src/lib/team/team-insights";
import { NotEvaluatedReport } from "@/src/components/coach/NotEvaluatedReport";

const turn = (role: "user" | "assistant", content: string, secondsFromStart = 1) => ({
  role,
  content,
  secondsFromStart,
  durationSeconds: 2,
});

const line = (speaker: "commercial" | "julie", text: string) => ({ speaker, timestamp: "00:01", text });

const competencies = (score: number) =>
  COACH_COMPETENCY_SCALE.map((entry) => ({
    id: entry.id,
    label: entry.label,
    score,
    weight: entry.weight,
    observation: "x",
    evidence: [],
  }));

/** Reproduit la simulation A réelle : ancien rapport, 1 réplique de Julie, noté 50/100. */
const simulationA = (): CoachReport =>
  ({
    reportId: "A",
    conversationId: "conv-aaaaaaaa",
    generatedAt: "2026-10-06T16:41:58.588Z",
    commercial: { id: "u1", name: "Test Verification" },
    prospect: { id: "julie-dupont", name: "Julie Dupont" },
    session: {
      date: "2026-10-06T16:40:38.314Z",
      durationSeconds: 48,
      selectedObjectiveIds: [],
      selectedObjectiveLabels: [],
      outcome: "interrupted",
      outcomeLabel: "Entretien interrompu techniquement",
    },
    overallScore: 50,
    scoreInterpretation: "Échange non évaluable",
    competencies: competencies(5),
    pedagogicalPriority: { competencyId: "conclusion", label: "PRIORITE-A", reason: "r" },
    nextActions: [{ title: "ACTION-A", instruction: "i" }],
    strengths: [],
    improvements: [],
    keyMoments: [],
    missedOpportunities: [],
    limitations: [],
    transcript: [line("julie", "Avant de commencer, je précise que vous échangez avec un avatar. Bonjour… Oui, je vous écoute ?")],
  }) as unknown as CoachReport;

/** Reproduit la simulation B réelle : ancien rapport, vrai dialogue, noté 16/100. */
const simulationB = (): CoachReport =>
  ({
    ...simulationA(),
    reportId: "B",
    conversationId: "conv-bbbbbbbb",
    generatedAt: "2026-10-06T17:10:00.000Z",
    session: { ...simulationA().session, date: "2026-10-06T17:05:00.000Z", durationSeconds: 173, outcome: "refused" },
    overallScore: 16,
    competencies: competencies(2),
    pedagogicalPriority: { competencyId: "decouverte-besoins", label: "PRIORITE-B", reason: "r" },
    nextActions: [{ title: "ACTION-B", instruction: "i" }],
    transcript: [
      line("julie", "Bonjour… Oui, je vous écoute ?"),
      line("commercial", "Bonjour madame, je suis conseiller chez Nice-Matin et je vous appelle pour une offre."),
      line("julie", "Je n'ai pas le temps, désolée."),
    ],
  }) as unknown as CoachReport;

const evaluatedAt = (day: number, score: number, id: string): CoachReport =>
  ({
    ...simulationB(),
    reportId: id,
    conversationId: `conv-${id}`,
    generatedAt: `2026-09-${String(day).padStart(2, "0")}T10:00:00.000Z`,
    session: { ...simulationB().session, date: `2026-09-${String(day).padStart(2, "0")}T09:00:00.000Z` },
    overallScore: score,
    competencies: competencies(Math.round(score / 10)),
    evaluationStatus: "evaluable",
  }) as CoachReport;

describe("décision d'évaluabilité (serveur)", () => {
  it("A. aucune parole du commercial : non évaluable", () => {
    expect(evaluateTranscriptEligibility([turn("assistant", "Bonjour, je vous écoute.")])).toEqual({
      evaluable: false,
      reason: "no_commercial_speech",
    });
  });

  it("transcript vide ou sans texte exploitable : transcript_unavailable", () => {
    expect(evaluateTranscriptEligibility([])).toEqual({ evaluable: false, reason: "transcript_unavailable" });
    expect(evaluateTranscriptEligibility([turn("user", "   "), turn("assistant", "…")])).toEqual({
      evaluable: false,
      reason: "transcript_unavailable",
    });
  });

  it("commercial qui n'a dit que quelques mots : données insuffisantes", () => {
    expect(MIN_COMMERCIAL_WORDS).toBe(3);
    expect(evaluateTranscriptEligibility([turn("assistant", "Bonjour, je vous écoute ?"), turn("user", "Allô ?")])).toEqual({
      evaluable: false,
      reason: "insufficient_usable_data",
    });
  });

  it("B. échange court mais réel, refus rapide de Julie : évaluable", () => {
    expect(
      evaluateTranscriptEligibility([
        turn("assistant", "Bonjour… Oui, je vous écoute ?"),
        turn("user", "Bonjour, je suis conseiller chez Nice-Matin."),
        turn("assistant", "Désolée, pas intéressée. Au revoir."),
      ]),
    ).toEqual({ evaluable: true });
  });

  it("C. très mauvais commercial mais échange complet : évaluable (la note ne décide jamais)", () => {
    expect(
      evaluateTranscriptEligibility([
        turn("assistant", "Bonjour… Oui, je vous écoute ?"),
        turn("user", "Achetez, c'est pas cher, dépêchez-vous."),
        turn("assistant", "Vous êtes très insistant."),
        turn("user", "Je m'en fiche, signez."),
      ]),
    ).toEqual({ evaluable: true });
  });
});

describe("compatibilité des anciens rapports", () => {
  it("D. ancien rapport comme la simulation A (sans statut, 0 parole commerciale) : non évalué", () => {
    expect(reportEvaluability(simulationA())).toEqual({ evaluable: false, reason: "no_commercial_speech" });
  });

  it("E. ancien rapport normal comme la simulation B : reste évalué", () => {
    expect(reportEvaluability(simulationB())).toEqual({ evaluable: true });
  });

  it("ancien rapport sans dialogue conservé : prudemment évaluable", () => {
    const { transcript: _transcript, ...withoutTranscript } = simulationA() as unknown as Record<string, unknown>;
    void _transcript;
    expect(reportEvaluability(withoutTranscript)).toEqual({ evaluable: true });
    expect(reportEvaluability(null)).toEqual({ evaluable: true });
    expect(reportEvaluability("n'importe quoi")).toEqual({ evaluable: true });
  });

  it("un statut enregistré fait foi, une raison inconnue est ramenée à une raison valide", () => {
    expect(reportEvaluability({ ...simulationB(), evaluationStatus: "not_evaluable", nonEvaluableReason: "no_commercial_speech" })).toEqual({
      evaluable: false,
      reason: "no_commercial_speech",
    });
    expect(reportEvaluability({ ...simulationA(), evaluationStatus: "evaluable" })).toEqual({ evaluable: true });
    expect(reportEvaluability({ evaluationStatus: "not_evaluable", nonEvaluableReason: "bizarre" })).toEqual({
      evaluable: false,
      reason: "insufficient_usable_data",
    });
  });
});

describe("F. un rapport non évaluable ne contamine rien", () => {
  const reports = [simulationA(), simulationB(), evaluatedAt(1, 40, "C")];

  it("moyennes, historique de scores et comptage", () => {
    const insights = computeReportInsights(reports, "/commercial/simulations");
    expect(insights.count).toBe(2);
    expect(insights.attemptsCount).toBe(3);
    expect(insights.averageScore).toBe(28);
    expect(insights.scoreHistory.map((point) => point.score)).toEqual([40, 16]);
    expect(insights.latestScore).toBe(16);
    expect(insights.progression).toBe(-24);
  });

  it("la simulation A reste visible dans la liste, sans note ; B garde 16/100", () => {
    const insights = computeReportInsights(reports, "/commercial/simulations");
    expect(insights.sessions).toHaveLength(3);
    expect(insights.sessions.find((s) => s.id === "A")?.score).toBeNull();
    expect(insights.sessions.find((s) => s.id === "B")?.score).toBe(16);
  });

  it("uniquement des simulations non évaluées : aucune statistique, mais la tentative est listée", () => {
    const insights = computeReportInsights([simulationA()], "/commercial/simulations");
    expect(insights.hasReports).toBe(false);
    expect(insights.averageScore).toBeNull();
    expect(insights.priority).toBeNull();
    expect(insights.sessions).toHaveLength(1);
    expect(insights.attemptsCount).toBe(1);
  });

  it("comparaison dernière / précédente : A est ignorée", () => {
    const deltas = competencyDeltas(reports);
    // B (notes 2) contre C (notes 4) : -20 points ; jamais contre A (notes 5).
    expect(deltas["conclusion"]).toBe(-20);
  });

  it("série hebdomadaire : une semaine ne comptant que A n'existe pas", () => {
    const onlyA = { ...simulationA(), generatedAt: "2026-10-06T10:00:00.000Z" } as CoachReport;
    expect(weeklyStreak([onlyA], Date.parse("2026-10-07T10:00:00.000Z"))).toBe(0);
    expect(weeklyStreak([simulationB()], Date.parse("2026-10-07T10:00:00.000Z"))).toBe(1);
  });

  it("statistiques manager : moyennes, semaines, progression, tentatives", () => {
    const profile = { id: "u1", slug: "test", firstName: "Test", lastName: "Verification" } as UserProfile;
    const member = buildTeamMember(profile, reports, Date.parse("2026-10-07T10:00:00.000Z"));
    expect(member.sessionsCount).toBe(2);
    expect(member.attemptsCount).toBe(3);
    expect(member.averageScore).toBe(28);

    const dashboard = buildManagerDashboard(profile, [profile], reports, Date.parse("2026-10-07T10:00:00.000Z"));
    expect(dashboard.sessionsCount).toBe(2);
    expect(dashboard.attemptsCount).toBe(3);
    expect(dashboard.teamAverageScore).toBe(28);
    expect(dashboard.weeklyEvolution.reduce((sum, week) => sum + week.sessions, 0)).toBe(2);
    expect(dashboard.recentSessions).toHaveLength(3);
    expect(dashboard.recentSessions.find((s) => s.id === "A")?.score).toBeNull();
  });

  it("le filtre ne garde que les rapports évalués", () => {
    expect(evaluatedReports(reports).map((r) => r.reportId)).toEqual(["B", "C"]);
  });

  it("mémoire du Coach : A n'est jamais transmise, B est la dernière vraie simulation", () => {
    const history = buildHistorySummaries([simulationA(), simulationB()]);
    expect(history).toHaveLength(1);
    expect(history[0].overallScore).toBe(16);
    expect(history[0].priority?.label).toBe("Découverte des besoins");
    expect(buildHistorySummaries([simulationA()])).toEqual([]);
    // Une simulation non évaluée récente ne pousse pas les vraies hors de la fenêtre.
    const many = [simulationA(), { ...simulationA(), reportId: "A2" }, { ...simulationA(), reportId: "A3" }, simulationB()];
    expect(buildHistorySummaries(many)).toHaveLength(1);
  });

  it("un rapport enregistré non évaluable est exclu de la mémoire du Coach", () => {
    const technical = buildNonEvaluableReport({
      reportId: "T",
      conversationId: "conv-tttttttt",
      reason: "no_commercial_speech",
      commercial: { id: "u1", name: "Test" },
      sessionDate: "2026-10-08T09:00:00.000Z",
      durationSeconds: 30,
      selectedObjectiveIds: [],
      selectedObjectiveLabels: [],
      transcript: [turn("assistant", "Bonjour")],
      perceptionAvailable: false,
    });
    expect(buildHistorySummaries([technical, simulationB()])).toHaveLength(1);
  });
});

describe("G. affichage d'une simulation non évaluée", () => {
  const technical = buildNonEvaluableReport({
    reportId: "T",
    conversationId: "conv-tttttttt",
    reason: "no_commercial_speech",
    commercial: { id: "u1", name: "Test Verification" },
    sessionDate: "2026-10-06T16:40:38.000Z",
    durationSeconds: 48,
    selectedObjectiveIds: [],
    selectedObjectiveLabels: [],
    transcript: [turn("assistant", "Bonjour… Oui, je vous écoute ?")],
    perceptionAvailable: false,
  });

  it("rapport technique : statut et raison structurés, aucun appel au Coach", () => {
    expect(technical.evaluationStatus).toBe("not_evaluable");
    expect(technical.nonEvaluableReason).toBe("no_commercial_speech");
    expect(technical.model).toBe("aucun");
    expect(technical.nextActions).toEqual([]);
    expect(technical.nextMission).toBeUndefined();
    expect(technical.progressionAnalysis).toBeUndefined();
  });

  it("commercial : message dédié, transcript conservé, aucune note ni contenu pédagogique", () => {
    const html = renderToStaticMarkup(<NotEvaluatedReport report={technical} variant="commercial" />);
    expect(html).toContain("Simulation non évaluée");
    expect(html).toContain("Aucune parole du commercial n&#x27;a été détectée pendant cet entretien");
    expect(html).toContain("n&#x27;est donc pas prise en compte dans votre progression");
    expect(html).toContain("je vous écoute");
    expect(html).not.toMatch(/\d+\s*\/\s*100/);
    expect(html).not.toContain("sur 100");
    for (const forbidden of ["Points forts", "Axes d", "prochaine mission", "Ma progression", "Votre priorité", "Ce que Julie a ressenti", "radar"]) {
      expect(html.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("ancienne simulation A (sans statut) : même affichage sans note", () => {
    const html = renderToStaticMarkup(<NotEvaluatedReport report={simulationA()} variant="commercial" />);
    expect(html).toContain("Simulation non évaluée");
    expect(html).not.toMatch(/\d+\s*\/\s*100/);
  });

  it("manager : tentative visible, exclusion expliquée, aucune note", () => {
    const html = renderToStaticMarkup(<NotEvaluatedReport report={technical} variant="manager" />);
    expect(html).toContain("Non évaluée");
    expect(html).toContain("exclue des scores");
    expect(html).not.toMatch(/\d+\s*\/\s*100/);
  });
});
