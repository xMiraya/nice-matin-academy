import { describe, expect, it, vi } from "vitest";
import {
  LATENCY_FLAG_KEY,
  LATENCY_REPORT_KEY,
  clearLatencySession,
  loadLatencySession,
  resolveLatencyDebug,
  sanitizeSession,
  saveLatencySession,
  type StorageLike,
} from "@/src/lib/tavus/latency-store";
import {
  LatencyTracker,
  REMOTE_AUDIO_THRESHOLD,
  computeStats,
  computeTurnMetrics,
  formatLatencyReport,
  summarise,
  type TavusEnvelope,
} from "@/src/lib/tavus/latency-turns";
import { createLatencyRecorder, readTavusEnvelope } from "@/src/lib/tavus/latency-metrics";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

const env = (
  eventType: string,
  role: string | undefined,
  extra: Partial<TavusEnvelope> = {},
): TavusEnvelope => ({
  eventType,
  role,
  serverTimestampMs: null,
  seq: null,
  turnIdx: null,
  inferenceId: null,
  ...extra,
});

const T0 = 1_000_000_000_000; // époque arbitraire, en ms
/** Horodatage Tavus fractionnaire (secondes → ms), donc de résolution fine. */
const server = (offsetMs: number) => T0 + offsetMs + 0.5;

describe("activation", () => {
  it("désactivé par défaut", () => {
    const storage = memoryStorage();
    expect(resolveLatencyDebug("", storage)).toBe(false);
    expect(resolveLatencyDebug("?autre=1", storage)).toBe(false);
    expect(storage.data).toEqual({});
  });

  it("l'enregistreur par défaut est inerte : rien n'est mesuré ni conservé", () => {
    const publish = vi.fn();
    const recorder = createLatencyRecorder({ publish });
    recorder.recordTavusEvent(env("conversation.stopped_speaking", "user"));
    recorder.recordRemoteAudioLevel(1);
    recorder.recordNetwork("low");
    expect(recorder.enabled).toBe(false);
    expect(recorder.getSession()).toBeNull();
    expect(publish).not.toHaveBeenCalled();
  });

  it("activation explicite par ?latencyDebug=1, mémorisée pour la suite de la session", () => {
    const storage = memoryStorage();
    expect(resolveLatencyDebug("?latencyDebug=1", storage)).toBe(true);
    expect(storage.data[LATENCY_FLAG_KEY]).toBe("1");
    expect(resolveLatencyDebug("", storage)).toBe(true);
  });

  it("?latencyDebug=0 désactive et efface les mesures", () => {
    const storage = memoryStorage({ [LATENCY_FLAG_KEY]: "1", [LATENCY_REPORT_KEY]: "{}" });
    expect(resolveLatencyDebug("?latencyDebug=0", storage)).toBe(false);
    expect(storage.data).toEqual({});
    expect(resolveLatencyDebug("", storage)).toBe(false);
  });

  it("une autre valeur que 1 n'active rien", () => {
    expect(resolveLatencyDebug("?latencyDebug=true", memoryStorage())).toBe(false);
  });

  it("un enregistreur activé publie une session vide au départ", () => {
    const publish = vi.fn();
    const recorder = createLatencyRecorder({ enabled: true, publish, now: () => 0 });
    expect(recorder.enabled).toBe(true);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish.mock.calls[0][0].turns).toEqual([]);
  });
});

describe("association des événements par tour", () => {
  it("rattache T0 à T4 au bon tour, deux tours consécutifs", () => {
    const tracker = new LatencyTracker("2026-10-06T10:00:00Z");
    // Tour 1
    tracker.ingest(env("conversation.stopped_speaking", "user", { seq: 1, turnIdx: 1, serverTimestampMs: server(0) }), T0);
    tracker.ingest(env("conversation.utterance", "user", { seq: 2, turnIdx: 1, serverTimestampMs: server(400) }), T0 + 410);
    tracker.ingest(env("conversation.utterance.streaming", "pal", { seq: 3, inferenceId: "inf-1", serverTimestampMs: server(900) }), T0 + 910);
    tracker.ingest(env("conversation.started_speaking", "pal", { seq: 4, turnIdx: 1, inferenceId: "inf-1", serverTimestampMs: server(1100) }), T0 + 1110);
    tracker.ingestRemoteAudio(0.3, T0 + 1200);
    // Tour 2
    tracker.ingest(env("conversation.stopped_speaking", "user", { seq: 5, turnIdx: 2, serverTimestampMs: server(8000) }), T0 + 8000);
    tracker.ingest(env("conversation.utterance", "user", { seq: 6, turnIdx: 2, serverTimestampMs: server(8500) }), T0 + 8510);
    tracker.ingest(env("conversation.started_speaking", "pal", { seq: 7, turnIdx: 2, inferenceId: "inf-2", serverTimestampMs: server(9600) }), T0 + 9610);
    tracker.ingestRemoteAudio(0.2, T0 + 9700);

    const { turns } = tracker.snapshot();
    expect(turns).toHaveLength(2);
    expect(turns[0]).toMatchObject({ index: 1, turnIdx: 1, inferenceId: "inf-1" });
    expect(turns[1]).toMatchObject({ index: 2, turnIdx: 2, inferenceId: "inf-2" });

    const m1 = computeTurnMetrics(turns[0]);
    expect(m1.endOfTurn).toEqual({ ms: 400, source: "tavus" });
    expect(m1.generation).toEqual({ ms: 700, source: "tavus" });
    expect(m1.streamingStart).toEqual({ ms: 500, source: "tavus" });
    expect(m1.streamingToSpeech).toEqual({ ms: 200, source: "tavus" });
    expect(m1.speechStart).toEqual({ ms: 1100, source: "tavus" });
    expect(m1.transport).toEqual({ ms: 90, source: "local" });
    expect(m1.total).toEqual({ ms: 1200, source: "local" });

    const m2 = computeTurnMetrics(turns[1]);
    expect(m2.total).toEqual({ ms: 1700, source: "local" });
    expect(m2.streamingStart.ms).toBeNull();
  });

  it("l'accueil de Julie (avant tout tour) et le doublon `replica` ne créent aucun tour", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.started_speaking", "pal"), T0);
    tracker.ingest(env("conversation.stopped_speaking", "pal"), T0 + 5000);
    expect(tracker.snapshot().turns).toHaveLength(0);

    tracker.ingest(env("conversation.stopped_speaking", "user"), T0 + 6000);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 6300);
    tracker.ingest(env("conversation.started_speaking", "pal"), T0 + 7000);
    tracker.ingest(env("conversation.started_speaking", "replica"), T0 + 7001);
    const { turns } = tracker.snapshot();
    expect(turns).toHaveLength(1);
    expect(turns[0].t3?.local).toBe(T0 + 7000);
  });

  it("le commercial reprend la parole avant la transmission : le dernier arrêt fait foi", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0 + 1500);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 1900);
    const { turns } = tracker.snapshot();
    expect(turns).toHaveLength(1);
    expect(turns[0].t0?.local).toBe(T0 + 1500);
  });

  it("reprise de parole après la transmission du texte : le premier tour reste incomplet", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 300);
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0 + 2000);
    const { turns } = tracker.snapshot();
    expect(turns).toHaveLength(2);
    expect(computeTurnMetrics(turns[0]).speechStart.ms).toBeNull();
  });

  it("un premier signe de réponse d'une autre inférence est écarté", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 300);
    tracker.ingest(env("conversation.utterance.streaming", "pal", { inferenceId: "A" }), T0 + 600);
    tracker.ingest(env("conversation.started_speaking", "pal", { inferenceId: "B" }), T0 + 900);
    const turn = tracker.snapshot().turns[0];
    expect(turn.t2).toBeNull();
    expect(turn.anomalies.join(" ")).toContain("autre inférence");
  });

  it("événements un peu dans le désordre (seq) : anomalie signalée sur le tour en cours", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user", { seq: 10 }), T0);
    tracker.ingest(env("conversation.utterance", "user", { seq: 8 }), T0 + 300);
    expect(tracker.snapshot().turns[0].anomalies.join(" ")).toContain("désordre");
  });
});

describe("événements manquants et valeurs impossibles", () => {
  it("jamais de valeur fabriquée : tout ce qui manque est « non mesurable »", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    const [turn] = tracker.snapshot().turns;
    const metrics = computeTurnMetrics(turn);
    for (const metric of Object.values(metrics)) {
      expect(metric.ms).toBeNull();
    }
    expect(metrics.total).toEqual({ ms: null, reason: "non mesurable" });
  });

  it("sans T4 : le total et le transport sont non mesurables, le reste est calculé", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 400);
    tracker.ingest(env("conversation.started_speaking", "pal"), T0 + 1400);
    const m = computeTurnMetrics(tracker.snapshot().turns[0]);
    expect(m.total.ms).toBeNull();
    expect(m.transport.ms).toBeNull();
    expect(m.endOfTurn).toEqual({ ms: 400, source: "local" });
    expect(m.generation).toEqual({ ms: 1000, source: "local" });
  });

  it("horodatages Tavus à la seconde entière : on se rabat sur la réception locale", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user", { serverTimestampMs: 1_700_000_000_000 }), T0);
    tracker.ingest(env("conversation.utterance", "user", { serverTimestampMs: 1_700_000_001_000 }), T0 + 450);
    const m = computeTurnMetrics(tracker.snapshot().turns[0]);
    expect(m.endOfTurn).toEqual({ ms: 450, source: "local" });
  });

  it("horodatages Tavus désordonnés : repli sur le local, ou non mesurable si le local l'est aussi", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user", { serverTimestampMs: server(1000) }), T0);
    tracker.ingest(env("conversation.utterance", "user", { serverTimestampMs: server(500) }), T0 + 400);
    expect(computeTurnMetrics(tracker.snapshot().turns[0]).endOfTurn).toEqual({ ms: 400, source: "local" });

    const reversed = new LatencyTracker();
    reversed.ingest(env("conversation.stopped_speaking", "user"), T0 + 1000);
    reversed.ingest(env("conversation.utterance", "user"), T0 + 200);
    expect(computeTurnMetrics(reversed.snapshot().turns[0]).endOfTurn).toEqual({
      ms: null,
      reason: "non mesurable (ordre impossible)",
    });
  });

  it("valeur aberrante : non mesurable", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 5 * 60_000);
    expect(computeTurnMetrics(tracker.snapshot().turns[0]).endOfTurn.ms).toBeNull();
  });

  it("audio détecté avant l'événement de début de parole : transport non mesurable, anomalie notée", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 300);
    tracker.ingestRemoteAudio(0.4, T0 + 900);
    tracker.ingest(env("conversation.started_speaking", "pal"), T0 + 1000);
    const turn = tracker.snapshot().turns[0];
    const m = computeTurnMetrics(turn);
    expect(m.transport).toEqual({ ms: null, reason: "non mesurable (audio détecté avant l'événement)" });
    expect(m.total.ms).toBe(900);
    expect(turn.anomalies.join(" ")).toContain("audio détecté avant");
  });

  it("le bruit sous le seuil et les niveaux invalides ne fixent pas T4", () => {
    const tracker = new LatencyTracker();
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    expect(tracker.ingestRemoteAudio(REMOTE_AUDIO_THRESHOLD / 2, T0 + 100)).toBe(false);
    expect(tracker.ingestRemoteAudio(Number.NaN, T0 + 200)).toBe(false);
    expect(tracker.ingestRemoteAudio(0.5, T0 - 50)).toBe(false);
    expect(tracker.ingestRemoteAudio(0.5, T0 + 300)).toBe(true);
    expect(tracker.ingestRemoteAudio(0.9, T0 + 400)).toBe(false); // seul le premier audio compte
  });
});

describe("statistiques", () => {
  it("médiane, moyenne, min, max", () => {
    expect(computeStats([1000, 3000, 2000])).toEqual({ count: 3, min: 1000, median: 2000, mean: 2000, max: 3000 });
    expect(computeStats([1000, 2000, 3000, 4000])).toEqual({ count: 4, min: 1000, median: 2500, mean: 2500, max: 4000 });
    expect(computeStats([])).toBeNull();
    expect(computeStats([Number.NaN])).toBeNull();
  });

  it("synthèse par étape sur les seuls tours mesurables", () => {
    const tracker = new LatencyTracker();
    for (const [i, total] of [1000, 2000, 3000].entries()) {
      const base = T0 + i * 10_000;
      tracker.ingest(env("conversation.stopped_speaking", "user"), base);
      tracker.ingest(env("conversation.utterance", "user"), base + 300);
      tracker.ingest(env("conversation.started_speaking", "pal"), base + total - 100);
      tracker.ingestRemoteAudio(0.5, base + total);
    }
    // Quatrième tour sans audio : exclu du total, présent ailleurs.
    const base = T0 + 40_000;
    tracker.ingest(env("conversation.stopped_speaking", "user"), base);
    tracker.ingest(env("conversation.utterance", "user"), base + 300);
    const stats = summarise(tracker.snapshot().turns);
    expect(stats.total).toEqual({ count: 3, min: 1000, median: 2000, mean: 2000, max: 3000 });
    expect(stats.endOfTurn?.count).toBe(4);
    expect(stats.transport).toEqual({ count: 3, min: 100, median: 100, mean: 100, max: 100 });
    expect(stats.streamingStart).toBeNull();
  });

  it("le rapport texte indique « non mesurable » plutôt que d'inventer", () => {
    const tracker = new LatencyTracker("2026-10-06T10:00:00Z");
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    const text = formatLatencyReport(tracker.snapshot());
    expect(text).toContain("LATENCE JULIE — DIAGNOSTIC");
    expect(text).toContain("Total : non mesurable");
    expect(text).toContain("Tour 1");
    expect(text).toContain("conversation.stopped_speaking|user : 1");
  });

  it("rapport complet : valeurs formatées sans contenu de conversation", () => {
    const tracker = new LatencyTracker("2026-10-06T10:00:00Z");
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    tracker.ingest(env("conversation.utterance", "user"), T0 + 420);
    tracker.ingest(env("conversation.started_speaking", "pal"), T0 + 1400);
    tracker.ingestRemoteAudio(0.4, T0 + 1480);
    const text = formatLatencyReport(tracker.snapshot());
    expect(text).toContain("Fin de parole -> utterance : 420 ms");
    expect(text).toContain("Utterance -> Julie parle : 980 ms");
    expect(text).toContain("Transport audio : 80 ms");
    expect(text).toContain("Total : 1 480 ms");
  });
});

describe("aucune collecte de contenu", () => {
  const SECRET = "PHRASE-CONFIDENTIELLE-DU-COMMERCIAL";
  const payload = {
    event_type: "conversation.utterance",
    timestamp: 1_700_000_000.25,
    seq: 12,
    turn_idx: 3,
    inference_id: "inf-9",
    conversation_id: "c123",
    properties: {
      role: "user",
      speech: SECRET,
      transcript: [{ content: SECRET }],
      text: SECRET,
      audio: "base64-secret",
    },
    speech: SECRET,
  };

  it("l'enveloppe lue ne contient que les champs techniques autorisés", () => {
    const envelope = readTavusEnvelope(payload);
    expect(envelope).toEqual({
      eventType: "conversation.utterance",
      role: "user",
      serverTimestampMs: 1_700_000_000_250,
      seq: 12,
      turnIdx: 3,
      inferenceId: "inf-9",
    });
    expect(JSON.stringify(envelope)).not.toContain(SECRET);
    expect(JSON.stringify(envelope)).not.toContain("base64");
  });

  it("formes inattendues ignorées", () => {
    expect(readTavusEnvelope(null)).toBeNull();
    expect(readTavusEnvelope("texte")).toBeNull();
    expect(readTavusEnvelope({ properties: {} })).toBeNull();
    expect(readTavusEnvelope({ event_type: "x", timestamp: "pas un nombre" })?.serverTimestampMs).toBeNull();
  });

  it("ni la session, ni le rapport, ni le stockage ne contiennent le texte", () => {
    const publish = vi.fn();
    const recorder = createLatencyRecorder({ enabled: true, publish, now: () => T0 });
    const envelope = readTavusEnvelope({ ...payload, event_type: "conversation.stopped_speaking" })!;
    recorder.recordTavusEvent(envelope);
    recorder.recordTavusEvent(readTavusEnvelope(payload)!);
    const session = recorder.getSession()!;
    expect(JSON.stringify(session)).not.toContain(SECRET);
    expect(formatLatencyReport(session)).not.toContain(SECRET);
    const storage = memoryStorage();
    saveLatencySession(storage, session);
    expect(JSON.stringify(storage.data)).not.toContain(SECRET);
  });

  it("un champ inconnu (par exemple un texte) glissé dans le stockage est écarté au chargement", () => {
    const tracker = new LatencyTracker("2026-10-06T10:00:00Z");
    tracker.ingest(env("conversation.stopped_speaking", "user"), T0);
    const dirty = JSON.parse(JSON.stringify(tracker.snapshot()));
    dirty.turns[0].text = SECRET;
    dirty.turns[0].t0.speech = SECRET;
    dirty.transcript = SECRET;
    const clean = sanitizeSession(dirty)!;
    expect(JSON.stringify(clean)).not.toContain(SECRET);
    expect(clean.turns[0].t0?.local).toBe(T0);
  });
});

describe("conservation temporaire et nettoyage", () => {
  it("survit à la redirection : enregistrement puis relecture", () => {
    const storage = memoryStorage();
    const tracker = new LatencyTracker("2026-10-06T10:00:00Z");
    tracker.ingest(env("conversation.stopped_speaking", "user", { seq: 1 }), T0);
    tracker.ingest(env("conversation.utterance", "user", { seq: 2 }), T0 + 400);
    saveLatencySession(storage, tracker.snapshot());

    // Nouvelle page (analyse) : même stockage de session, nouvel état en mémoire.
    const restored = loadLatencySession(storage)!;
    expect(restored.turns).toHaveLength(1);
    expect(computeTurnMetrics(restored.turns[0]).endOfTurn.ms).toBe(400);
    expect(restored.eventCounts["conversation.utterance|user"]).toBe(1);
  });

  it("le nettoyage supprime les mesures", () => {
    const storage = memoryStorage();
    saveLatencySession(storage, new LatencyTracker().snapshot());
    expect(loadLatencySession(storage)).not.toBeNull();
    clearLatencySession(storage);
    expect(loadLatencySession(storage)).toBeNull();
    expect(storage.data[LATENCY_REPORT_KEY]).toBeUndefined();
  });

  it("contenu illisible ou stockage indisponible : aucune erreur", () => {
    expect(loadLatencySession(memoryStorage({ [LATENCY_REPORT_KEY]: "{pas du json" }))).toBeNull();
    expect(loadLatencySession(memoryStorage({ [LATENCY_REPORT_KEY]: JSON.stringify({ version: 2 }) }))).toBeNull();
    const broken: StorageLike = {
      getItem: () => {
        throw new Error("indisponible");
      },
      setItem: () => {
        throw new Error("indisponible");
      },
      removeItem: () => {
        throw new Error("indisponible");
      },
    };
    expect(loadLatencySession(broken)).toBeNull();
    expect(() => saveLatencySession(broken, new LatencyTracker().snapshot())).not.toThrow();
    expect(() => clearLatencySession(broken)).not.toThrow();
    expect(resolveLatencyDebug("?latencyDebug=1", broken)).toBe(true);
    expect(resolveLatencyDebug("", broken)).toBe(false);
  });
});
