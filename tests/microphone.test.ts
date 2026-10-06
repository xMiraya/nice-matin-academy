import { describe, expect, it, vi } from "vitest";
import {
  classifyMediaError,
  probeCamera,
  probeMicrophone,
  rmsLevel,
  trackFailure,
  verifyMicrophone,
  type MediaDevicesLike,
} from "@/src/lib/media/microphone";
import { deriveMicRuntime, type MicRuntimeInput } from "@/src/lib/media/mic-runtime";
import { createConversationIfMicReady } from "@/src/lib/media/call-gate";

interface FakeTrack {
  readyState: string;
  enabled: boolean;
  muted: boolean;
  stop: ReturnType<typeof vi.fn>;
  getSettings: () => { deviceId?: string };
}

const fakeTrack = (overrides: Partial<FakeTrack> = {}, deviceId = "mic-1"): FakeTrack => ({
  readyState: "live",
  enabled: true,
  muted: false,
  stop: vi.fn(),
  getSettings: () => ({ deviceId }),
  ...overrides,
});

const fakeStream = (audio: FakeTrack[], video: FakeTrack[] = []) =>
  ({
    getAudioTracks: () => audio,
    getVideoTracks: () => video,
    getTracks: () => [...audio, ...video],
  }) as unknown as MediaStream;

const device = (deviceId: string, kind: MediaDeviceKind, label = "") =>
  ({ deviceId, kind, label, groupId: "", toJSON: () => ({}) }) as MediaDeviceInfo;

const domError = (name: string) => Object.assign(new Error(name), { name });

function fakeMediaDevices(options: {
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  devices?: MediaDeviceInfo[];
}): MediaDevicesLike & { getUserMedia: ReturnType<typeof vi.fn> } {
  return {
    getUserMedia: vi.fn(options.getUserMedia ?? (async () => fakeStream([fakeTrack()]))),
    enumerateDevices: async () => options.devices ?? [device("mic-1", "audioinput", "Realtek")],
  };
}

describe("contrôle réel du microphone", () => {
  it("microphone disponible : piste ouverte, périphérique actif et liste", async () => {
    const md = fakeMediaDevices({});
    const probe = await probeMicrophone(md);
    expect(probe.ok).toBe(true);
    if (probe.ok) {
      expect(probe.deviceId).toBe("mic-1");
      expect(probe.devices).toEqual([{ deviceId: "mic-1", label: "Realtek" }]);
    }
  });

  it("permission refusée", async () => {
    const md = fakeMediaDevices({ getUserMedia: async () => Promise.reject(domError("NotAllowedError")) });
    expect(await probeMicrophone(md)).toEqual({ ok: false, failure: "denied" });
  });

  it("microphone absent", async () => {
    const md = fakeMediaDevices({ getUserMedia: async () => Promise.reject(domError("NotFoundError")) });
    expect(await probeMicrophone(md)).toEqual({ ok: false, failure: "absent" });
  });

  it("microphone occupé par une autre application", async () => {
    const md = fakeMediaDevices({ getUserMedia: async () => Promise.reject(domError("NotReadableError")) });
    expect(await probeMicrophone(md)).toEqual({ ok: false, failure: "busy" });
  });

  it("API média indisponible", async () => {
    expect(await probeMicrophone(undefined)).toEqual({ ok: false, failure: "unsupported" });
  });

  it("piste créée mais inexploitable (terminée, désactivée, coupée) : échec et flux libéré", async () => {
    for (const broken of [{ readyState: "ended" }, { enabled: false }, { muted: true }]) {
      const track = fakeTrack(broken);
      const md = fakeMediaDevices({ getUserMedia: async () => fakeStream([track]) });
      expect(await probeMicrophone(md)).toEqual({ ok: false, failure: "inactive" });
      expect(track.stop).toHaveBeenCalled();
    }
  });

  it("flux sans piste audio : inactif", async () => {
    const md = fakeMediaDevices({ getUserMedia: async () => fakeStream([]) });
    expect(await probeMicrophone(md)).toEqual({ ok: false, failure: "inactive" });
  });

  it("plusieurs périphériques : tous listés, libellé de repli, périphérique demandé utilisé", async () => {
    const md = fakeMediaDevices({
      devices: [
        device("mic-1", "audioinput", "Realtek"),
        device("mic-2", "audioinput", ""),
        device("cam-1", "videoinput", "Caméra"),
      ],
      getUserMedia: async () => fakeStream([fakeTrack({}, "mic-2")]),
    });
    const probe = await probeMicrophone(md, "mic-2");
    expect(md.getUserMedia).toHaveBeenCalledWith({ audio: { deviceId: { exact: "mic-2" } } });
    expect(probe.ok && probe.devices.map((d) => d.label)).toEqual(["Realtek", "Microphone 2"]);
    expect(probe.ok && probe.deviceId).toBe("mic-2");
  });

  it("périphérique mémorisé débranché : retombe sur le micro par défaut", async () => {
    const md = fakeMediaDevices({
      getUserMedia: vi
        .fn()
        .mockRejectedValueOnce(domError("OverconstrainedError"))
        .mockResolvedValueOnce(fakeStream([fakeTrack()])),
    });
    const probe = await probeMicrophone(md, "disparu");
    expect(probe.ok).toBe(true);
    expect(md.getUserMedia).toHaveBeenLastCalledWith({ audio: true });
  });

  it("le contrôle avant lancement referme le micro", async () => {
    const track = fakeTrack();
    const md = fakeMediaDevices({ getUserMedia: async () => fakeStream([track]) });
    expect(await verifyMicrophone(md)).toEqual({ ok: true });
    expect(track.stop).toHaveBeenCalled();
  });

  it("caméra : détectée ou refusée, jamais conservée", async () => {
    const video = fakeTrack();
    const ok = fakeMediaDevices({
      getUserMedia: async () => fakeStream([], [video]),
      devices: [device("cam-1", "videoinput")],
    });
    expect(await probeCamera(ok)).toEqual({ ok: true, deviceCount: 1 });
    expect(video.stop).toHaveBeenCalled();

    const denied = fakeMediaDevices({ getUserMedia: async () => Promise.reject(domError("NotAllowedError")) });
    expect(await probeCamera(denied)).toEqual({ ok: false, failure: "denied" });
  });

  it("classe les erreurs et les pistes", () => {
    expect(classifyMediaError(domError("SecurityError"))).toBe("denied");
    expect(classifyMediaError(new Error("autre"))).toBe("error");
    expect(trackFailure(null)).toBe("inactive");
    expect(trackFailure({ readyState: "live", enabled: true, muted: false })).toBeNull();
  });
});

describe("jauge de niveau", () => {
  it("silence : niveau nul ; voix : niveau qui réagit ; borné à 1", () => {
    expect(rmsLevel(new Uint8Array(512).fill(128))).toBe(0);
    const speech = Uint8Array.from({ length: 512 }, (_, i) => 128 + Math.round(30 * Math.sin(i / 3)));
    const level = rmsLevel(speech);
    expect(level).toBeGreaterThan(0.2);
    expect(rmsLevel(Uint8Array.from({ length: 512 }, (_, i) => (i % 2 ? 255 : 0)))).toBe(1);
    expect(rmsLevel([])).toBe(0);
  });

  it("un micro silencieux mais actif n'est pas un échec", async () => {
    const md = fakeMediaDevices({});
    const probe = await probeMicrophone(md);
    // Le contrôle ne dépend que de l'état de la piste, jamais du niveau sonore.
    expect(probe.ok).toBe(true);
  });
});

const joined = (overrides: Partial<MicRuntimeInput> = {}): MicRuntimeInput => ({
  joined: true,
  wanted: true,
  settled: true,
  trackState: "playable",
  track: { readyState: "live", enabled: true, muted: false },
  ...overrides,
});

describe("état réel du micro pendant l'appel", () => {
  it("piste active : actif", () => {
    expect(deriveMicRuntime(joined())).toBe("active");
  });

  it("avant la jonction, une piste jouable ne prouve rien", () => {
    expect(deriveMicRuntime(joined({ joined: false }))).toBe("pending");
  });

  it("piste absente après la jonction : en attente puis perdue", () => {
    expect(deriveMicRuntime(joined({ trackState: undefined, track: null, settled: false }))).toBe("pending");
    expect(deriveMicRuntime(joined({ trackState: undefined, track: null }))).toBe("lost");
    expect(deriveMicRuntime(joined({ trackState: "off", track: null }))).toBe("lost");
  });

  it("mute / unmute", () => {
    expect(deriveMicRuntime(joined({ wanted: false, trackState: "off", track: null }))).toBe("muted");
    expect(deriveMicRuntime(joined({ wanted: true }))).toBe("active");
  });

  it("piste coupée par le système : perdue une fois le délai écoulé", () => {
    const silent = { readyState: "live", enabled: true, muted: true };
    expect(deriveMicRuntime(joined({ track: silent, settled: false }))).toBe("pending");
    expect(deriveMicRuntime(joined({ track: silent }))).toBe("lost");
  });

  it("perte de piste puis récupération", () => {
    expect(deriveMicRuntime(joined())).toBe("active");
    expect(deriveMicRuntime(joined({ trackState: "interrupted" }))).toBe("lost");
    expect(deriveMicRuntime(joined({ trackState: "blocked", track: null }))).toBe("lost");
    expect(deriveMicRuntime(joined({ track: { readyState: "ended", enabled: true, muted: false } }))).toBe("lost");
    expect(deriveMicRuntime(joined({ trackState: "loading", track: null }))).toBe("lost");
    expect(deriveMicRuntime(joined())).toBe("active");
  });
});

describe("aucune conversation Tavus si le micro est inutilisable", () => {
  it("n'appelle jamais l'API de création quand le contrôle échoue", async () => {
    const tavusFetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response("{}"));
    for (const failure of ["denied", "absent", "busy", "inactive", "unsupported", "error"] as const) {
      const result = await createConversationIfMicReady({
        verify: async () => ({ ok: false, failure }),
        create: () => tavusFetch("/api/tavus/conversations", { method: "POST" }),
      });
      expect(result).toEqual({ started: false, failure });
    }
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("n'appelle pas l'API non plus si le contrôle lui-même plante", async () => {
    const tavusFetch = vi.fn<(url: string) => Promise<Response>>(async () => new Response("{}"));
    const result = await createConversationIfMicReady({
      verify: async () => {
        throw new Error("boom");
      },
      create: async () => tavusFetch("/api/tavus/conversations"),
    });
    expect(result).toEqual({ started: false, failure: "error" });
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("de bout en bout : un vrai contrôle en échec bloque la création", async () => {
    const tavusFetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response("{}"));
    const md = fakeMediaDevices({ getUserMedia: async () => Promise.reject(domError("NotFoundError")) });
    const result = await createConversationIfMicReady({
      verify: () => verifyMicrophone(md),
      create: () => tavusFetch("/api/tavus/conversations", { method: "POST" }),
    });
    expect(result).toEqual({ started: false, failure: "absent" });
    expect(tavusFetch).not.toHaveBeenCalled();
  });

  it("crée la conversation une seule fois quand le micro est utilisable", async () => {
    const tavusFetch = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => new Response("{}"));
    const md = fakeMediaDevices({});
    const result = await createConversationIfMicReady({
      verify: () => verifyMicrophone(md),
      create: () => tavusFetch("/api/tavus/conversations", { method: "POST" }),
    });
    expect(result.started).toBe(true);
    expect(tavusFetch).toHaveBeenCalledTimes(1);
  });
});
