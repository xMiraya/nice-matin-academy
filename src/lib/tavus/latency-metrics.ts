/**
 * Instrumentation de latence de l'appel Julie — **développement uniquement**.
 *
 * Objectif : mesurer le délai réellement perçu par le commercial entre la fin de
 * sa propre parole et le début de la parole de Julie, à partir des événements
 * officiels Tavus (`app-message`) et Daily.
 *
 * ## Confidentialité — règle non négociable
 *
 * Ce module ne journalise **que** des noms d'événements, des horodatages et des
 * durées. Jamais le contenu des paroles, jamais le transcript, jamais le prompt
 * maître, jamais une clé, jamais une métadonnée privée. Le champ `properties`
 * des messages Tavus n'est lu que pour un seul champ : `role` (`"user"`,
 * `"pal"` ou `"replica"`), qui indique qui parle et ne contient aucun contenu.
 *
 * ## Événements Tavus utilisés (vérifiés dans la documentation CVI)
 * - `conversation.started_speaking` / `conversation.stopped_speaking`
 *   avec `properties.role` valant `"user"`, `"pal"` ou `"replica"` (doublon
 *   hérité de `"pal"`).
 * - `conversation.utterance` : l'utterance de l'utilisateur a été transcrite et
 *   remise au LLM. Seul le nom de l'événement est retenu.
 *
 * En production, `record()` sort immédiatement : aucun horodatage n'est pris,
 * aucun log n'est émis, aucun état n'est conservé.
 */

/** Activée hors production uniquement. */
export const IS_LATENCY_INSTRUMENTATION_ENABLED = process.env.NODE_ENV !== "production";

/** Étapes suivies dans un tour de parole. */
export type LatencyMarker =
  | "user-speech-end"
  | "user-utterance-received"
  | "julie-speech-start"
  | "julie-speech-end";

/** Une mesure complète : fin de parole du commercial → début de parole de Julie. */
export interface TurnLatencySample {
  /** Numéro du tour depuis le début de l'appel. */
  turn: number;
  /** Fin de parole utilisateur → transcription reçue, en ms. `null` si non observé. */
  transcriptionMs: number | null;
  /** Transcription reçue → début de parole de Julie, en ms. `null` si non observé. */
  responseMs: number | null;
  /** Fin de parole utilisateur → début de parole de Julie, en ms. */
  totalMs: number;
}

export interface LatencyRecorder {
  /** Enregistre une étape. Sans effet en production. */
  record: (marker: LatencyMarker) => void;
  /**
   * Enregistre un événement Tavus brut à partir de son seul nom et de son rôle.
   * Les événements inconnus sont journalisés par nom, sans être interprétés.
   */
  recordTavusEvent: (eventType: string, role?: string) => void;
  /** Enregistre un événement Daily de cycle de vie (nom seul). */
  recordLifecycle: (eventName: string) => void;
  /** Dernier échantillon complet, ou `null` si aucun tour n'a encore été mesuré. */
  getLastSample: () => TurnLatencySample | null;
  /** Tous les échantillons de l'appel, dans l'ordre. */
  getSamples: () => TurnLatencySample[];
}

const NO_OP: LatencyRecorder = {
  record: () => undefined,
  recordTavusEvent: () => undefined,
  recordLifecycle: () => undefined,
  getLastSample: () => null,
  getSamples: () => [],
};

const LOG_PREFIX = "[latence Julie]";

/** `performance.now()` est monotone : insensible aux ajustements d'horloge. */
function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function round(value: number): number {
  return Math.round(value);
}

/**
 * Crée un enregistreur de latence pour un appel.
 *
 * @param onSample Appelé à chaque tour complet, pour l'affichage éventuel d'un
 *   indicateur de développement. Reçoit uniquement des durées.
 */
export function createLatencyRecorder(
  onSample?: (sample: TurnLatencySample) => void,
): LatencyRecorder {
  if (!IS_LATENCY_INSTRUMENTATION_ENABLED) return NO_OP;

  const startedAt = now();
  const samples: TurnLatencySample[] = [];

  let turn = 0;
  let userSpeechEndAt: number | null = null;
  let utteranceAt: number | null = null;
  // Empêche de mesurer deux fois le même tour si Tavus émet le doublon
  // `role: "replica"` en plus de `role: "pal"`.
  let turnMeasured = true;

  const log = (eventName: string, details?: Record<string, number | null>) => {
    const elapsed = round(now() - startedAt);
    // Instrumentation de développement : noms et durées uniquement.
    console.info(`${LOG_PREFIX} ${eventName} · t+${elapsed}ms`, details ?? "");
  };

  const record = (marker: LatencyMarker) => {
    const at = now();

    switch (marker) {
      case "user-speech-end":
        userSpeechEndAt = at;
        utteranceAt = null;
        turnMeasured = false;
        log(marker);
        return;

      case "user-utterance-received":
        utteranceAt = at;
        log(marker, {
          depuisFinParoleMs: userSpeechEndAt === null ? null : round(at - userSpeechEndAt),
        });
        return;

      case "julie-speech-start": {
        if (userSpeechEndAt === null || turnMeasured) {
          log(marker);
          return;
        }
        turnMeasured = true;
        turn += 1;

        const sample: TurnLatencySample = {
          turn,
          transcriptionMs: utteranceAt === null ? null : round(utteranceAt - userSpeechEndAt),
          responseMs: utteranceAt === null ? null : round(at - utteranceAt),
          totalMs: round(at - userSpeechEndAt),
        };
        samples.push(sample);
        log(marker, {
          tour: sample.turn,
          transcriptionMs: sample.transcriptionMs,
          reponseMs: sample.responseMs,
          totalMs: sample.totalMs,
        });
        onSample?.(sample);
        return;
      }

      case "julie-speech-end":
        log(marker);
        return;
    }
  };

  const recordTavusEvent = (eventType: string, role?: string) => {
    // `role` est le seul champ de `properties` lu, et ne contient aucun contenu.
    const isUser = role === "user";
    const isJulie = role === "pal" || role === "replica";

    if (eventType === "conversation.stopped_speaking" && isUser) {
      record("user-speech-end");
      return;
    }
    if (eventType === "conversation.started_speaking" && isJulie) {
      record("julie-speech-start");
      return;
    }
    if (eventType === "conversation.stopped_speaking" && isJulie) {
      record("julie-speech-end");
      return;
    }
    if (eventType === "conversation.utterance") {
      // L'utterance de Julie est renvoyée elle aussi : seul le tour utilisateur
      // sert de repère de transcription.
      if (!isJulie) record("user-utterance-received");
      return;
    }

    // Événement non interprété : nom seul, aucune donnée associée.
    log(`tavus:${eventType}`);
  };

  const recordLifecycle = (eventName: string) => log(`daily:${eventName}`);

  return {
    record,
    recordTavusEvent,
    recordLifecycle,
    getLastSample: () => samples[samples.length - 1] ?? null,
    getSamples: () => [...samples],
  };
}

/**
 * Extrait, sans faire confiance à la forme du message, le nom d'événement et le
 * rôle d'un `app-message` Tavus. Retourne `null` si le message n'a pas la forme
 * attendue. Aucun autre champ n'est lu.
 */
export function readTavusEventName(data: unknown): { eventType: string; role?: string } | null {
  if (typeof data !== "object" || data === null) return null;

  const message = data as { event_type?: unknown; properties?: unknown };
  if (typeof message.event_type !== "string") return null;

  const properties = message.properties;
  const role =
    typeof properties === "object" && properties !== null
      ? (properties as { role?: unknown }).role
      : undefined;

  return {
    eventType: message.event_type,
    role: typeof role === "string" ? role : undefined,
  };
}
