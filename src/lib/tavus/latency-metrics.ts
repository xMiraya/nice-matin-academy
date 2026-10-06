/**
 * Instrumentation de latence de l'appel Julie, activée explicitement.
 *
 * Objectif : mesurer, tour par tour, le délai entre la fin de parole du
 * commercial et la réponse de Julie, à partir des événements officiels Tavus
 * (`app-message`) et du niveau audio distant de Daily.
 *
 * Désactivée par défaut : sans `?latencyDebug=1`, l'enregistreur est inerte —
 * aucun horodatage pris, aucun observateur Daily, aucun log, aucun stockage.
 *
 * ## Confidentialité — règle non négociable
 *
 * Seuls sont lus : le nom de l'événement, `properties.role`, `timestamp`, `seq`,
 * `turn_idx` et `inference_id`. Jamais le contenu des paroles, le transcript,
 * le prompt, une clé ou une donnée personnelle. Aucun audio ni vidéo n'est
 * enregistré. Les mesures restent dans `sessionStorage`, jamais en base.
 *
 * La logique de calcul est dans `latency-turns.ts`, la conservation dans
 * `latency-store.ts`.
 */

import {
  LatencyTracker,
  type LatencySession,
  type TavusEnvelope,
} from "@/src/lib/tavus/latency-turns";
import { publishLatencySession } from "@/src/lib/tavus/latency-store";

export type { TavusEnvelope } from "@/src/lib/tavus/latency-turns";

export interface LatencyRecorder {
  /** Vrai si l'enregistreur collecte réellement des mesures. */
  readonly enabled: boolean;
  /** Enregistre un événement Tavus (enveloppe technique uniquement). */
  recordTavusEvent: (envelope: TavusEnvelope) => void;
  /** Niveau audio distant de Daily (0 à 1). */
  recordRemoteAudioLevel: (level: number) => void;
  /** Changement de qualité réseau Daily (nom du seuil). */
  recordNetwork: (threshold: string) => void;
  /** Événement Daily de cycle de vie (nom seul). */
  recordLifecycle: (eventName: string) => void;
  getSession: () => LatencySession | null;
}

const NO_OP: LatencyRecorder = {
  enabled: false,
  recordTavusEvent: () => undefined,
  recordRemoteAudioLevel: () => undefined,
  recordNetwork: () => undefined,
  recordLifecycle: () => undefined,
  getSession: () => null,
};

const LOG_PREFIX = "[latence Julie]";

/** Heure locale en ms (époque Unix, sous-milliseconde), comparable aux horodatages Tavus. */
function wallClock(): number {
  if (typeof performance !== "undefined" && typeof performance.timeOrigin === "number") {
    return performance.timeOrigin + performance.now();
  }
  return Date.now();
}

/**
 * Crée un enregistreur pour un appel. Avec `enabled: false` (valeur par
 * défaut), retourne un objet inerte.
 */
export function createLatencyRecorder(options: {
  enabled?: boolean;
  now?: () => number;
  publish?: (session: LatencySession) => void;
} = {}): LatencyRecorder {
  if (!options.enabled) return NO_OP;

  const now = options.now ?? wallClock;
  const publish = options.publish ?? publishLatencySession;
  const tracker = new LatencyTracker();
  // Un nouvel appel remplace les mesures de l'appel précédent.
  publish(tracker.snapshot());

  const log = (name: string, details?: Record<string, number | string | null>) => {
    console.info(`${LOG_PREFIX} ${name}`, details ?? "");
  };

  return {
    enabled: true,
    recordTavusEvent: (envelope) => {
      tracker.ingest(envelope, now());
      publish(tracker.snapshot());
      log(`tavus:${envelope.eventType}`, { role: envelope.role ?? null, seq: envelope.seq, turn_idx: envelope.turnIdx });
    },
    recordRemoteAudioLevel: (level) => {
      if (tracker.ingestRemoteAudio(level, now())) {
        publish(tracker.snapshot());
        log("daily:audio-distant-detecte");
      }
    },
    recordNetwork: (threshold) => {
      tracker.ingestNetwork(threshold, now());
      publish(tracker.snapshot());
    },
    recordLifecycle: (eventName) => log(`daily:${eventName}`),
    getSession: () => tracker.snapshot(),
  };
}

const numberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/**
 * Extrait, sans faire confiance à la forme du message, l'enveloppe technique
 * d'un `app-message` Tavus. Retourne `null` si le message n'a pas la forme
 * attendue. Liste blanche stricte : aucun autre champ n'est lu ni conservé,
 * en particulier aucun contenu de parole.
 *
 * Les champs de suivi peuvent se trouver à la racine ou dans `properties`.
 * `timestamp` est en secondes Unix (éventuellement fractionnaires).
 */
export function readTavusEnvelope(data: unknown): TavusEnvelope | null {
  if (typeof data !== "object" || data === null) return null;

  const message = data as Record<string, unknown>;
  if (typeof message.event_type !== "string") return null;

  const properties =
    typeof message.properties === "object" && message.properties !== null
      ? (message.properties as Record<string, unknown>)
      : {};

  const pick = (name: string) => message[name] ?? properties[name];

  const seconds = numberOrNull(pick("timestamp"));
  const inference = pick("inference_id");

  return {
    eventType: message.event_type.slice(0, 80),
    role: typeof properties.role === "string" ? properties.role.slice(0, 20) : undefined,
    // Secondes Unix selon la documentation ; une valeur déjà en millisecondes est conservée.
    serverTimestampMs: seconds === null ? null : seconds > 1e11 ? seconds : seconds * 1000,
    seq: numberOrNull(pick("seq")),
    turnIdx: numberOrNull(pick("turn_idx")),
    inferenceId: typeof inference === "string" ? inference.slice(0, 80) : null,
  };
}
