import { beforeEach, describe, expect, it, vi } from "vitest";
import { COACH_COMPETENCY_SCALE } from "@/src/lib/coach/competency-scale";
import type { CoachModelOutput } from "@/src/lib/coach/schema";

const parse = vi.fn();
vi.mock("openai", () => ({
  default: class {
    responses = { parse: (...args: unknown[]) => parse(...args) };
  },
}));

const getCurrentUser = vi.fn();
vi.mock("@/src/server/auth", () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock("@/src/server/access/conversations", () => ({ isConversationOwner: async () => true }));

const getTavusConversation = vi.fn();
vi.mock("@/src/lib/tavus/get-conversation", () => ({
  getTavusConversation: (...args: unknown[]) => getTavusConversation(...args),
  isValidConversationId: () => true,
}));

interface Query {
  sql: string;
  params: unknown[];
}
const queries: Query[] = [];
let historyRows: { data: unknown }[] = [];
vi.mock("@/src/server/db", () => ({
  getDb: async () => ({
    query: async (sql: string, params: unknown[] = []) => {
      queries.push({ sql, params });
      if (sql.includes("WHERE conversation_id = $1")) return { rows: [] };
      if (sql.includes("conversation_id <> $2")) return { rows: historyRows };
      return { rows: [] };
    },
  }),
}));

const { POST } = await import("@/app/api/coach/analyze/route");

const modelOutput = (score = 6): CoachModelOutput => ({
  outcome: "refused",
  outcomeLabel: "Refus",
  scoreInterpretation: "Entretien perfectible",
  competencies: COACH_COMPETENCY_SCALE.map((entry) => ({ id: entry.id, score, observation: "o", evidence: [] })),
  psychologicalState: { confidence: 50, interest: 50, understanding: 50, perceivedValue: 50, feltPressure: 30 },
  strengths: [],
  improvements: [],
  nextActions: [],
  keyMoments: [],
  missedOpportunities: [],
  commercialSummary: "Résumé.",
  managerSummary: "Résumé manager.",
  pedagogicalPriority: { competencyId: "conclusion", reason: "r" },
  confidenceLevel: "medium",
  limitations: [],
  progressionAnalysis: {
    hasHistory: true,
    summary: "s",
    previousPriorityApplied: "no",
    previousPriorityComment: "c",
    progressPoints: [],
  },
  nextMission: { title: "T", instruction: "I", competencyId: "conclusion", successCriteria: "S" },
});

const conversation = (transcript: { role: "user" | "assistant"; content: string }[], transcriptReady = true) => ({
  kind: "ok",
  conversation: {
    status: "ended",
    hasShutdown: true,
    transcriptReady,
    transcript: transcript.map((entry, index) => ({ ...entry, secondsFromStart: index * 5, durationSeconds: 3 })),
    perception: null,
    durationSeconds: 60,
    shutdownReason: null,
    createdAt: "2026-10-06T16:40:38.000Z",
  },
});

const request = () =>
  new Request("http://localhost/api/coach/analyze", {
    method: "POST",
    body: JSON.stringify({
      conversationId: "cf091a31063dc46a",
      difficulty: "intermediaire",
      selectedObjectiveIds: ["objection-prix"],
      selectedObjectiveLabels: ["Gestion de l'objection prix"],
    }),
  });

const inserted = () => queries.filter((q) => q.sql.includes("INSERT INTO reports"));

beforeEach(() => {
  parse.mockReset();
  getTavusConversation.mockReset();
  getCurrentUser.mockReset();
  queries.length = 0;
  historyRows = [];
  process.env.OPENAI_API_KEY = "test-key";
  getCurrentUser.mockResolvedValue({
    role: "commercial",
    profile: { id: "u1", firstName: "Test", lastName: "Verification" },
    email: "t@t.fr",
  });
});

describe("POST /api/coach/analyze : évaluabilité", () => {
  it("A. aucune parole du commercial : rapport technique enregistré, AUCUN appel OpenAI", async () => {
    getTavusConversation.mockResolvedValue(
      conversation([{ role: "assistant", content: "Bonjour, je vous écoute." }]),
    );
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(parse).not.toHaveBeenCalled();
    expect(body.report.evaluationStatus).toBe("not_evaluable");
    expect(body.report.nonEvaluableReason).toBe("no_commercial_speech");
    expect(body.report.transcript).toHaveLength(1);
    expect(inserted()).toHaveLength(1);
    expect(JSON.parse(inserted()[0].params[4] as string).evaluationStatus).toBe("not_evaluable");
    // L'historique n'est même pas lu : aucune analyse n'est lancée.
    expect(queries.some((q) => q.sql.includes("conversation_id <> $2"))).toBe(false);
  });

  it("transcript prêt mais vide : non évaluable, aucun appel OpenAI", async () => {
    getTavusConversation.mockResolvedValue(conversation([], true));
    const body = await (await POST(request())).json();
    expect(body.report.nonEvaluableReason).toBe("transcript_unavailable");
    expect(parse).not.toHaveBeenCalled();
  });

  it("transcript pas encore prêt : toujours en attente, rien d'enregistré", async () => {
    getTavusConversation.mockResolvedValue(conversation([], false));
    const response = await POST(request());
    expect(response.status).toBe(202);
    expect(parse).not.toHaveBeenCalled();
    expect(inserted()).toHaveLength(0);
  });

  it("B. échange court mais réel : évalué, exactement UN appel OpenAI", async () => {
    parse.mockResolvedValue({ output_parsed: modelOutput(6) });
    getTavusConversation.mockResolvedValue(
      conversation([
        { role: "assistant", content: "Bonjour, je vous écoute ?" },
        { role: "user", content: "Bonjour, je suis conseiller chez Nice-Matin." },
        { role: "assistant", content: "Désolée, pas intéressée." },
      ]),
    );
    const body = await (await POST(request())).json();
    expect(parse).toHaveBeenCalledTimes(1);
    expect(body.report.evaluationStatus).toBe("evaluable");
    expect(body.report.overallScore).toBe(60);
    expect(inserted()).toHaveLength(1);
  });

  it("C. très mauvais commercial mais échange complet : évalué même à 0/100", async () => {
    parse.mockResolvedValue({ output_parsed: modelOutput(0) });
    getTavusConversation.mockResolvedValue(
      conversation([
        { role: "assistant", content: "Bonjour, je vous écoute ?" },
        { role: "user", content: "Achetez, c'est pas cher, signez maintenant." },
      ]),
    );
    const body = await (await POST(request())).json();
    expect(parse).toHaveBeenCalledTimes(1);
    expect(body.report.evaluationStatus).toBe("evaluable");
    expect(body.report.overallScore).toBe(0);
  });

  it("mémoire du Coach : la simulation A est écartée, B est transmise", async () => {
    const legacy = (id: string, label: string, speaker: "julie" | "commercial", text: string) => ({
      data: {
        reportId: id,
        generatedAt: id === "A" ? "2026-10-06T16:41:00.000Z" : "2026-10-06T17:10:00.000Z",
        overallScore: id === "A" ? 50 : 16,
        session: { date: id === "A" ? "2026-10-06T16:40:00.000Z" : "2026-10-06T17:05:00.000Z" },
        competencies: [],
        pedagogicalPriority: { competencyId: "conclusion", label, reason: "raison" },
        nextActions: [{ title: `ACTION-${id}`, instruction: "faire" }],
        transcript: [{ speaker, timestamp: "00:01", text }],
      },
    });
    historyRows = [
      legacy("B", "Conclusion", "commercial", "Bonjour madame, je suis conseiller chez Nice-Matin."),
      legacy("A", "Conclusion", "julie", "Bonjour, je vous écoute."),
    ];
    parse.mockResolvedValue({ output_parsed: modelOutput() });
    getTavusConversation.mockResolvedValue(
      conversation([
        { role: "assistant", content: "Bonjour ?" },
        { role: "user", content: "Bonjour madame, je vous appelle pour une offre." },
      ]),
    );
    await POST(request());
    const sent = (parse.mock.calls[0][0] as { input: { content: string }[] }).input[1].content;
    expect(sent).toContain("ACTION-B");
    expect(sent).not.toContain("ACTION-A");
    expect(sent).toContain("Simulation précédente n°1");
    expect(sent).not.toContain("Simulation précédente n°2");
  });
});
