import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_HISTORY_REPORTS,
  buildHistorySummaries,
  formatHistoryBlock,
  summariseReport,
} from "@/src/lib/coach/history";
import { COACH_COMPETENCY_SCALE } from "@/src/lib/coach/competency-scale";
import { COACH_SYSTEM_PROMPT, buildCoachUserPayload } from "@/src/lib/coach/prompt";
import { CoachModelOutputSchema, type CoachModelOutput } from "@/src/lib/coach/schema";

const parse = vi.fn();
vi.mock("openai", () => ({
  default: class {
    responses = { parse: (...args: unknown[]) => parse(...args) };
  },
}));

const { analyzeConversation, buildCoachReport } = await import("@/src/lib/coach/analyze-conversation");

const modelOutput = (overrides: Partial<CoachModelOutput> = {}): CoachModelOutput => ({
  outcome: "postponed",
  outcomeLabel: "Décision reportée",
  scoreInterpretation: "Entretien perfectible",
  competencies: COACH_COMPETENCY_SCALE.map((entry, index) => ({
    id: entry.id,
    score: 4 + (index % 4),
    observation: "Observation.",
    evidence: [],
  })),
  psychologicalState: { confidence: 50, interest: 50, understanding: 50, perceivedValue: 50, feltPressure: 30 },
  strengths: [],
  improvements: [],
  nextActions: [],
  keyMoments: [],
  missedOpportunities: [],
  commercialSummary: "Résumé.",
  managerSummary: "Résumé manager.",
  pedagogicalPriority: { competencyId: "decouverte-besoins", reason: "Découverte trop courte." },
  confidenceLevel: "medium",
  limitations: [],
  progressionAnalysis: {
    hasHistory: true,
    summary: "Progrès sur la découverte.",
    previousPriorityApplied: "partially",
    previousPriorityComment: "Deux questions ouvertes posées.",
    progressPoints: [
      { competencyId: "decouverte-besoins", direction: "improved", explanation: "Plus de questions." },
      { competencyId: "conclusion", direction: "stable", explanation: "Inchangée." },
      { competencyId: "communication", direction: "declined", explanation: "Plus d'interruptions." },
      { competencyId: "premier-contact", direction: "stable", explanation: "Quatrième point à écarter." },
    ],
  },
  nextMission: {
    title: "Approfondir la découverte",
    instruction: "Explore les habitudes d'information avant de présenter l'offre.",
    competencyId: "decouverte-besoins",
    successCriteria: "Identifier deux habitudes avant l'argumentaire.",
  },
  ...overrides,
});

const fullReport = (day: number, overrides: Record<string, unknown> = {}) => ({
  reportId: `r${day}`,
  generatedAt: `2026-09-${String(day).padStart(2, "0")}T10:00:00.000Z`,
  overallScore: 50 + day,
  session: { date: `2026-09-${String(day).padStart(2, "0")}T09:00:00.000Z`, difficulty: "facile" },
  competencies: COACH_COMPETENCY_SCALE.map((entry) => ({ id: entry.id, score: 5, observation: "x", evidence: [] })),
  pedagogicalPriority: { competencyId: "conclusion", label: "Conclusion", reason: "Conclusion absente." },
  nextActions: [{ title: "Proposer une suite", instruction: "Conclure par une date." }],
  transcript: [{ speaker: "commercial", timestamp: "00:01", text: "TEXTE-SECRET-DU-TRANSCRIPT prononcé par le commercial" }],
  ...overrides,
});

const baseInput = {
  transcript: [{ role: "user" as const, content: "Bonjour", secondsFromStart: 1, durationSeconds: 1 }],
  perception: null,
  durationSeconds: 60,
  shutdownReason: null,
  selectedObjectiveLabels: [],
  commercialName: "Test",
};

const reportInput = (output: CoachModelOutput, historyCount?: number) => ({
  reportId: "rep",
  conversationId: "conv-12345678",
  model: "m",
  output,
  commercial: { id: "u1", name: "Test" },
  sessionDate: "2026-10-01T09:00:00.000Z",
  durationSeconds: 60,
  selectedObjectiveIds: [],
  selectedObjectiveLabels: [],
  transcriptAvailable: true,
  transcript: [],
  perceptionAvailable: false,
  extraLimitations: [],
  historyCount,
});

beforeEach(() => {
  parse.mockReset();
  process.env.OPENAI_API_KEY = "test-key";
});

describe("construction de l'historique compact", () => {
  it("ne garde que trois rapports, du plus récent au plus ancien", () => {
    const history = buildHistorySummaries([1, 2, 3, 4, 5].map((day) => fullReport(day)));
    expect(MAX_HISTORY_REPORTS).toBe(3);
    expect(history.map((entry) => entry.overallScore)).toEqual([55, 54, 53]);
  });

  it("ne transmet jamais le transcript, ni dans le résumé ni dans le prompt", () => {
    const history = buildHistorySummaries([fullReport(1)]);
    expect(JSON.stringify(history)).not.toContain("TEXTE-SECRET");
    const payload = buildCoachUserPayload({ ...baseInput, history });
    expect(payload).not.toContain("TEXTE-SECRET");
    expect(payload).toContain("HISTORIQUE PÉDAGOGIQUE DU COMMERCIAL");
    expect(payload).toContain("Conclusion absente.");
  });

  it("reprend la mission des rapports qui en portent une", () => {
    const withMission = fullReport(2, {
      nextMission: { title: "Mission A", instruction: "Faire B", competencyId: "conclusion", successCriteria: "C" },
    });
    expect(summariseReport(withMission)?.mission).toMatchObject({ title: "Mission A", successCriteria: "C" });
    expect(formatHistoryBlock([summariseReport(withMission)!])).toContain("Mission A");
  });
});

describe("absence d'historique", () => {
  it("indique qu'aucune comparaison n'est possible", () => {
    expect(buildHistorySummaries([])).toEqual([]);
    const payload = buildCoachUserPayload({ ...baseInput, history: [] });
    expect(payload).toContain("Aucun rapport précédent");
    expect(buildCoachUserPayload(baseInput)).toContain("Aucun rapport précédent");
  });

  it("force une progression vide côté serveur, même si le modèle invente une comparaison", () => {
    const report = buildCoachReport(reportInput(modelOutput(), 0));
    expect(report.progressionAnalysis).toMatchObject({
      hasHistory: false,
      previousPriorityApplied: "not_evaluable",
      progressPoints: [],
    });
    expect(report.nextMission?.title).toBe("Approfondir la découverte");
  });
});

describe("compatibilité et robustesse", () => {
  it("lit un ancien rapport sans progressionAnalysis ni nextMission", () => {
    const summary = summariseReport(fullReport(3));
    expect(summary).toMatchObject({ overallScore: 53, priority: { competencyId: "conclusion" }, mission: null });
  });

  it("ignore les rapports illisibles, incomplets ou à compétence inconnue sans erreur", () => {
    const history = buildHistorySummaries([
      null,
      "texte",
      42,
      {},
      { session: { date: "2026-09-01" } },
      { generatedAt: "2026-09-02", overallScore: 61, competencies: [{ id: "inconnue", score: 9 }, { id: "conclusion", score: "x" }], pedagogicalPriority: { competencyId: "inconnue" }, nextActions: "absent" },
      { generatedAt: "2026-09-03", competencies: "oups", nextActions: [{ title: 5 }, null] },
    ]);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ overallScore: 61, competencies: [], priority: null, nextActions: [] });
  });

  it("accepte un rapport sans nextActions mais avec notes", () => {
    const summary = summariseReport({ generatedAt: "2026-09-02", overallScore: 40 });
    expect(summary).toMatchObject({ overallScore: 40, nextActions: [] });
    expect(formatHistoryBlock([summary!])).toContain("Actions recommandées : non disponibles");
  });

  it("normalise une compétence de mission inconnue vers la priorité actuelle", () => {
    const output = modelOutput({
      nextMission: { title: "T", instruction: "I", competencyId: "decouverte-besoins", successCriteria: "S" },
    });
    (output.nextMission as { competencyId: string }).competencyId = "inconnue";
    const report = buildCoachReport(reportInput(output, 1));
    expect(report.nextMission?.competencyId).toBe(report.pedagogicalPriority.competencyId);
  });
});

describe("progressionAnalysis et nextMission", () => {
  it("garde au plus trois évolutions et supprime les compétences inconnues", () => {
    const output = modelOutput();
    output.progressionAnalysis.progressPoints.unshift({
      competencyId: "decouverte-besoins",
      direction: "improved",
      explanation: "ok",
    });
    (output.progressionAnalysis.progressPoints[0] as { competencyId: string }).competencyId = "inconnue";
    const report = buildCoachReport(reportInput(output, 2));
    expect(report.progressionAnalysis?.hasHistory).toBe(true);
    expect(report.progressionAnalysis?.progressPoints).toHaveLength(3);
    expect(report.progressionAnalysis?.progressPoints.every((p) => String(p.competencyId) !== "inconnue")).toBe(true);
    expect(report.progressionAnalysis?.previousPriorityApplied).toBe("partially");
  });

  it("exige les nouveaux champs dans la sortie structurée du modèle", () => {
    expect(CoachModelOutputSchema.safeParse(modelOutput()).success).toBe(true);
    const withoutMission: Partial<CoachModelOutput> = modelOutput();
    delete withoutMission.nextMission;
    expect(CoachModelOutputSchema.safeParse(withoutMission).success).toBe(false);
  });

  it("produit une mission unique et complète", () => {
    const report = buildCoachReport(reportInput(modelOutput(), 1));
    expect(report.nextMission).toEqual({
      title: "Approfondir la découverte",
      instruction: "Explore les habitudes d'information avant de présenter l'offre.",
      competencyId: "decouverte-besoins",
      successCriteria: "Identifier deux habitudes avant l'argumentaire.",
    });
  });
});

describe("indépendance du scoring vis-à-vis de l'historique", () => {
  it("donne les mêmes notes avec ou sans historique", () => {
    const output = modelOutput();
    const without = buildCoachReport(reportInput(output, 0));
    const withHistory = buildCoachReport(reportInput(output, 3));
    expect(withHistory.overallScore).toBe(without.overallScore);
    expect(withHistory.competencies).toEqual(without.competencies);
  });

  it("ne dépend d'aucun champ de progression ni de mission", () => {
    const base = buildCoachReport(reportInput(modelOutput(), 3));
    const other = buildCoachReport(
      reportInput(
        modelOutput({
          progressionAnalysis: { hasHistory: true, summary: "x", previousPriorityApplied: "no", previousPriorityComment: "", progressPoints: [] },
        }),
        3,
      ),
    );
    expect(other.overallScore).toBe(base.overallScore);
  });

  it("interdit explicitement dans le prompt de moduler les notes selon l'historique", () => {
    expect(COACH_SYSTEM_PROMPT).toContain("UNIQUEMENT sur la simulation actuelle");
    expect(COACH_SYSTEM_PROMPT).toContain("Ne jamais augmenter ou diminuer une note");
  });
});

describe("un seul appel OpenAI", () => {
  it("intègre l'historique dans l'appel existant", async () => {
    parse.mockResolvedValue({ output_parsed: modelOutput() });
    const history = buildHistorySummaries([fullReport(1), fullReport(2)]);
    const outcome = await analyzeConversation({ ...baseInput, history });
    expect(outcome.kind).toBe("ok");
    expect(parse).toHaveBeenCalledTimes(1);
    const call = parse.mock.calls[0][0] as { input: { content: string }[] };
    expect(call.input[1].content).toContain("Simulation précédente n°2");
    expect(call.input[1].content).not.toContain("TEXTE-SECRET");
  });
});
