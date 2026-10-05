import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeStore, requirement } from "./fake-store";

const fake = createFakeStore();
const getCurrentUser = vi.fn();
const recordConversation = vi.fn<(...args: unknown[]) => Promise<void>>(async () => undefined);

vi.mock("@/src/server/auth", () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock("@/src/server/access/pg-store", () => ({ pgAccessStore: fake.store }));
vi.mock("@/src/server/access/conversations", () => ({
  recordConversation: (...args: unknown[]) => recordConversation(...args),
  isConversationOwner: async () => true,
}));

const { POST } = await import("@/app/api/tavus/conversations/route");

const profile = (id: string) => ({ id, firstName: "A", lastName: "B" });
const commercialUser = { role: "commercial", profile: profile("u1"), email: "a@b.fr" };
const managerUser = { role: "manager", profile: profile("m1"), email: "m@b.fr" };
const request = () =>
  new Request("http://localhost/api/tavus/conversations", {
    method: "POST",
    body: JSON.stringify({ difficulty: "facile" }),
  });

const tavusFetch = vi.fn();

const grantedOverride = (revokedAt: string | null) => ({
  id: "o1",
  userId: "u1",
  simulationId: "julie",
  reason: "Motif",
  grantedBy: "m1",
  grantedAt: "2026-01-01T00:00:00Z",
  expiresAt: null,
  revokedAt,
});

beforeEach(() => {
  fake.state.threshold = 90;
  fake.state.requirements = [requirement("ASSESSMENT", "niveau-1")];
  fake.state.attempts = [];
  fake.state.overrides = [];
  fake.state.events = [];
  fake.state.failReads = false;
  getCurrentUser.mockReset();
  recordConversation.mockClear();
  tavusFetch.mockReset();
  vi.stubGlobal("fetch", tavusFetch);
  process.env.TAVUS_API_KEY = "test-key";
  process.env.TAVUS_FACE_ID = "face";
  process.env.TAVUS_PAL_ID = "pal";
});

const tavusOk = () =>
  new Response(
    JSON.stringify({
      conversation_id: "c123456789",
      conversation_url: "https://tavus.example/room",
      status: "active",
    }),
    { status: 200 },
  );

describe("POST /api/tavus/conversations", () => {
  it("1. refuse un utilisateur non connecté, sans appeler Tavus", async () => {
    getCurrentUser.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("11. contournement par appel direct : 403, aucun appel Tavus, refus journalisé", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    fake.state.attempts = [{ userId: "u1", kind: "ASSESSMENT", targetId: "niveau-1", score: 82 }];
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      eligible: false,
      requiredScore: 90,
      requirements: [{ type: "ASSESSMENT", completed: true, bestScore: 82, requiredScore: 90, passed: false }],
    });
    expect(tavusFetch).not.toHaveBeenCalled();
    expect(recordConversation).not.toHaveBeenCalled();
    expect(fake.state.events.map((e) => e.type)).toEqual(["ACCESS_DENIED"]);
  });

  it("refuse sans aucune tentative, sans fuite de la clé Tavus", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(JSON.stringify(await response.json())).not.toContain("test-key");
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("10. n'utilise pas les résultats d'un autre compte", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    fake.state.attempts = [{ userId: "u2", kind: "ASSESSMENT", targetId: "niveau-1", score: 100 }];
    expect((await POST(request())).status).toBe(403);
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("refuse par prudence si la base est indisponible (503), sans Tavus", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    fake.state.failReads = true;
    expect((await POST(request())).status).toBe(503);
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("crée la conversation quand tous les prérequis sont validés", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    fake.state.attempts = [{ userId: "u1", kind: "ASSESSMENT", targetId: "niveau-1", score: 90 }];
    tavusFetch.mockResolvedValue(tavusOk());
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(tavusFetch).toHaveBeenCalledTimes(1);
    expect(recordConversation).toHaveBeenCalledWith("u1", "julie", "c123456789");
    expect(fake.state.events.map((e) => e.type)).toEqual(["FIRST_ACCESS"]);
  });

  it("12. une dérogation valide permet la création", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    fake.state.overrides = [grantedOverride(null)];
    tavusFetch.mockResolvedValue(tavusOk());
    expect((await POST(request())).status).toBe(201);
  });

  it("13. une dérogation annulée ne permet pas la création", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    fake.state.overrides = [grantedOverride("2026-01-02T00:00:00Z")];
    expect((await POST(request())).status).toBe(403);
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("15. erreur Tavus après validation : 502, ni premier accès ni conversation enregistrés", async () => {
    getCurrentUser.mockResolvedValue(commercialUser);
    fake.state.attempts = [{ userId: "u1", kind: "ASSESSMENT", targetId: "niveau-1", score: 95 }];
    tavusFetch.mockResolvedValue(new Response("boom", { status: 500 }));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(tavusFetch).toHaveBeenCalledTimes(1);
    expect(recordConversation).not.toHaveBeenCalled();
    expect(fake.state.events.some((e) => e.type === "FIRST_ACCESS")).toBe(false);
  });

  it("un manager n'est pas soumis aux prérequis", async () => {
    getCurrentUser.mockResolvedValue(managerUser);
    tavusFetch.mockResolvedValue(tavusOk());
    expect((await POST(request())).status).toBe(201);
  });
});
