/**
 * Contrôle technique réel du microphone et de la caméra, côté navigateur.
 *
 * Une autorisation accordée ne prouve pas qu'un micro fonctionne : on ouvre
 * réellement une piste audio, on vérifie qu'elle est vivante, activée et non
 * coupée par le système, puis on mesure son niveau.
 *
 * Aucun audio n'est enregistré ni envoyé : le flux ne sert qu'à lire un niveau
 * sonore localement, puis il est arrêté.
 */

export type MicFailure =
  /** Autorisation refusée (ou bloquée par le navigateur). */
  | "denied"
  /** Aucun périphérique audio disponible. */
  | "absent"
  /** Périphérique occupé par une autre application. */
  | "busy"
  /** Piste créée mais inexploitable : terminée, désactivée ou coupée par le système. */
  | "inactive"
  /** API média indisponible (contexte non sécurisé, navigateur ancien). */
  | "unsupported"
  | "error";

export interface MediaDevicesLike {
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  enumerateDevices(): Promise<MediaDeviceInfo[]>;
}

export interface MicDevice {
  deviceId: string;
  label: string;
}

export type MicProbe =
  | { ok: true; stream: MediaStream; devices: MicDevice[]; deviceId: string | null }
  | { ok: false; failure: MicFailure };

export type CameraProbe =
  | { ok: true; deviceCount: number }
  | { ok: false; failure: MicFailure };

export type MicVerdict = { ok: true } | { ok: false; failure: MicFailure };

/** Traduit une erreur `getUserMedia` en cause compréhensible. */
export function classifyMediaError(error: unknown): MicFailure {
  const name = (error as { name?: unknown } | null)?.name;
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "absent";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "busy";
    default:
      return "error";
  }
}

export interface TrackLike {
  readyState: string;
  enabled: boolean;
  muted: boolean;
}

/** Une piste est exploitable si elle est vivante, activée et non coupée. */
export function trackFailure(track: TrackLike | null | undefined): MicFailure | null {
  if (!track) return "inactive";
  if (track.readyState !== "live") return "inactive";
  if (!track.enabled) return "inactive";
  if (track.muted) return "inactive";
  return null;
}

export const MIC_FAILURE_MESSAGES: Record<MicFailure, string> = {
  denied:
    "L'accès au microphone est refusé. Autorisez-le dans la barre d'adresse de votre navigateur, puis réessayez.",
  absent: "Votre microphone n'est pas détecté. Branchez-en un ou sélectionnez-en un autre.",
  busy: "Votre microphone est utilisé par une autre application. Fermez-la, puis réessayez.",
  inactive:
    "Votre microphone est détecté mais ne transmet aucun signal. Vérifiez qu'il n'est pas coupé, puis réessayez.",
  unsupported: "Ce navigateur ne permet pas d'utiliser le microphone sur cette page.",
  error: "Le microphone n'a pas pu être initialisé. Réessayez ou choisissez un autre microphone.",
};

function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

async function listAudioInputs(md: MediaDevicesLike): Promise<MicDevice[]> {
  try {
    const all = await md.enumerateDevices();
    return all
      .filter((device) => device.kind === "audioinput" && device.deviceId)
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`,
      }));
  } catch {
    return [];
  }
}

/**
 * Ouvre réellement le microphone. Le flux est rendu à l'appelant (qui doit
 * l'arrêter) uniquement si la piste est exploitable.
 *
 * Un périphérique mémorisé mais débranché retombe sur le micro par défaut.
 */
export async function probeMicrophone(
  md: MediaDevicesLike | null | undefined,
  preferredDeviceId?: string | null,
): Promise<MicProbe> {
  if (!md || typeof md.getUserMedia !== "function") return { ok: false, failure: "unsupported" };

  const open = (deviceId?: string | null) =>
    md.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId } } : true });

  let stream: MediaStream;
  try {
    stream = await open(preferredDeviceId);
  } catch (error) {
    const failure = classifyMediaError(error);
    if (preferredDeviceId && failure === "absent") {
      return probeMicrophone(md, null);
    }
    return { ok: false, failure };
  }

  const track = stream.getAudioTracks()[0];
  const failure = trackFailure(track);
  if (failure) {
    stopStream(stream);
    return { ok: false, failure };
  }

  const devices = await listAudioInputs(md);
  const activeId = track.getSettings?.().deviceId ?? preferredDeviceId ?? devices[0]?.deviceId ?? null;
  return { ok: true, stream, devices, deviceId: activeId };
}

/** Contrôle ponctuel avant la création de la conversation : ouvre puis referme le micro. */
export async function verifyMicrophone(
  md: MediaDevicesLike | null | undefined,
  deviceId?: string | null,
): Promise<MicVerdict> {
  const probe = await probeMicrophone(md, deviceId);
  if (!probe.ok) return probe;
  stopStream(probe.stream);
  return { ok: true };
}

/** Teste la caméra (autorisation et présence), puis la libère aussitôt. */
export async function probeCamera(md: MediaDevicesLike | null | undefined): Promise<CameraProbe> {
  if (!md || typeof md.getUserMedia !== "function") return { ok: false, failure: "unsupported" };
  try {
    const stream = await md.getUserMedia({ video: true });
    const live = stream.getVideoTracks().some((track) => trackFailure(track) === null);
    stopStream(stream);
    if (!live) return { ok: false, failure: "inactive" };
    let count = 1;
    try {
      count = (await md.enumerateDevices()).filter((device) => device.kind === "videoinput").length || 1;
    } catch {
      // Le dénombrement n'est qu'informatif.
    }
    return { ok: true, deviceCount: count };
  } catch (error) {
    return { ok: false, failure: classifyMediaError(error) };
  }
}

/* ------------------------------------------------------------------ */
/* Niveau sonore                                                       */
/* ------------------------------------------------------------------ */

/** Niveau de 0 à 1 à partir d'un tampon temporel 8 bits (centré sur 128). */
export function rmsLevel(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const centered = (samples[i] - 128) / 128;
    sum += centered * centered;
  }
  const rms = Math.sqrt(sum / samples.length);
  // Une voix normale donne un RMS de l'ordre de 0,05 à 0,2 : on l'étire.
  return Math.min(1, rms * 4);
}

/**
 * Mesure en continu le niveau d'un flux. Rien n'est enregistré ni transmis.
 * Retourne la fonction d'arrêt. Sans API audio, aucun niveau n'est émis.
 */
export function startLevelMeter(stream: MediaStream, onLevel: (level: number) => void): () => void {
  const Ctor =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return () => undefined;

  let context: AudioContext;
  try {
    context = new Ctor();
  } catch {
    return () => undefined;
  }

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buffer = new Uint8Array(analyser.fftSize);

  void context.resume().catch(() => undefined);

  let stopped = false;
  let last = 0;
  const tick = (now: number) => {
    if (stopped) return;
    // ~20 images par seconde suffisent à une jauge.
    if (now - last >= 50) {
      last = now;
      analyser.getByteTimeDomainData(buffer);
      onLevel(rmsLevel(buffer));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return () => {
    stopped = true;
    try {
      source.disconnect();
    } catch {
      // Déjà déconnecté.
    }
    void context.close().catch(() => undefined);
  };
}

/* ------------------------------------------------------------------ */
/* Mémorisation du périphérique choisi                                 */
/* ------------------------------------------------------------------ */

const MIC_STORAGE_KEY = "nm:mic-device";

export function readStoredMicId(): string | null {
  try {
    return window.localStorage.getItem(MIC_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeMicId(deviceId: string | null): void {
  try {
    if (deviceId) window.localStorage.setItem(MIC_STORAGE_KEY, deviceId);
    else window.localStorage.removeItem(MIC_STORAGE_KEY);
  } catch {
    // Stockage indisponible : le choix vaut pour la session en cours.
  }
}
