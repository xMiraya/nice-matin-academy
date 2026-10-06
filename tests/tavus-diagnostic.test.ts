import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inspectKey, runTavusDiagnostic } from "@/src/server/tavus-diagnostic";

const SECRET = "SECRET-KEY-VALUE-1234567890";
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  process.env.TAVUS_API_KEY = `  ${SECRET}\n`;
  process.env.TAVUS_PAL_ID = "p123";
  process.env.TAVUS_FACE_ID = "r456";
});
afterEach(() => vi.restoreAllMocks());

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("diagnostic Tavus", () => {
  it("détecte les caractères parasites sans jamais renvoyer la clé", () => {
    const report = inspectKey(`  ${SECRET}\r\n`);
    expect(report).toMatchObject({
      present: true,
      lengthBeforeTrim: SECRET.length + 4,
      lengthAfterTrim: SECRET.length,
      leadingOrTrailingWhitespace: true,
      containsCarriageReturnOrNewline: true,
    });
    expect(JSON.stringify(report)).not.toContain(SECRET);
  });

  it("n'envoie que des GET, avec la clé nettoyée dans x-api-key", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ data: [{ persona_id: "p123" }] }))
      .mockResolvedValueOnce(json({ persona_id: "p123", persona_name: "NM Prospect P001", layers: { llm: { model: "m" } } }))
      .mockResolvedValueOnce(json({ replica_id: "r456", replica_name: "Julie", status: "completed" }));
    const result = await runTavusDiagnostic();
    for (const [, init] of fetchMock.mock.calls) {
      expect(init.method).toBe("GET");
      expect(init.headers["x-api-key"]).toBe(SECRET);
    }
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/conversations"))).toBe(false);
    expect(result.pal).toMatchObject({ found: true, matchesExpectedName: true, inListing: true });
    expect(result.face).toMatchObject({ found: true, name: "Julie" });
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  it("s'arrête dès le premier 401 et n'expose ni la clé ni davantage de requêtes", async () => {
    fetchMock.mockResolvedValue(json({ message: `Invalid access token ${SECRET}` }, 401));
    const result = await runTavusDiagnostic();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.probes[0]).toMatchObject({ httpStatus: 401, ok: false });
    expect(JSON.stringify(result)).not.toContain(SECRET);
    expect(result.pal.found).toBe(false);
  });

  it("n'appelle pas Tavus sans clé", async () => {
    delete process.env.TAVUS_API_KEY;
    const result = await runTavusDiagnostic();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.key.present).toBe(false);
  });
});
