/**
 * Mesure de latence conversationnelle de Julie, tour par tour. Logique pure.
 *
 * ## Confidentialité — règle non négociable
 *
 * Ce module ne manipule que des noms d'événements, des rôles (`user` / `pal`),
 * des horodatages, des numéros de séquence ou de tour et des identifiants
 * techniques d'inférence. Il ne reçoit jamais le contenu d'une parole, d'un
 * transcript ou d'une réponse : l'enveloppe `TavusEnvelope` est construite par
 * liste blanche (voir `readTavusEnvelope`).
 *
 * ## Étapes d'un tour
 * - T0 : `conversation.stopped_speaking`, rôle `user` ;
 * - T1 : `conversation.utterance`, rôle `user` (le texte est remis au LLM) ;
 * - T2 : premier `conversation.utterance.streaming` du PAL (si Tavus l'émet) ;
 * - T3 : `conversation.started_speaking`, rôle PAL ;
 * - T4 : premier audio distant détecté côté Daily (niveau sonore), mesure locale.
 *
 * Aucune valeur n'est jamais fabriquée : une étape absente donne
 * « non mesurable ».
 */

/** Seuil de niveau audio distant (0 à 1) au-delà duquel Julie est considérée comme audible. */
export const REMOTE_AUDIO_THRESHOLD = 0.02;
/** Au-delà, un intervalle est considéré comme aberrant et n'est pas mesuré. */
export const MAX_PLAUSIBLE_INTERVAL_MS = 60_000;

/** Enveloppe technique d'un événement Tavus, sans aucun contenu. */
export interface TavusEnvelope {
  eventType: string;
  role?: string;
  /** Horodatage Tavus converti en millisecondes (Unix), `null` s'il est absent. */
  serverTimestampMs: number | null;
  seq: number | null;
  turnIdx: number | null;
  inferenceId: string | null;
}

export interface Stamp {
  /** Réception côté navigateur, en ms (époque Unix, sous-milliseconde). */
  local: number;
  /** Horodatage fourni par Tavus, en ms (Unix), s'il existe. */
  server: number | null;
  seq: number | null;
}

export interface TurnRecord {
  /** Numéro du tour mesuré, à partir de 1. */
  index: number;
  turnIdx: number | null;
  inferenceId: string | null;
  t0: Stamp | null;
  t1: Stamp | null;
  t2: Stamp | null;
  t3: Stamp | null;
  /** Premier audio distant détecté, réception locale (ms, époque Unix). */
  t4: number | null;
  anomalies: string[];
}

export interface NetworkEvent {
  at: number;
  threshold: string;
}

export interface LatencySession {
  version: 1;
  startedAt: string;
  turns: TurnRecord[];
  /** Compteurs « type|rôle » : aident à savoir quels événements Tavus arrivent réellement. */
  eventCounts: Record<string, number>;
  network: NetworkEvent[];
}

export type MetricKey =
  | "total"
  | "endOfTurn"
  | "generation"
  | "transport"
  | "speechStart"
  | "streamingStart"
  | "streamingToSpeech";

export type Metric =
  | { ms: number; source: "tavus" | "local" }
  | { ms: null; reason: string };

export const METRIC_LABELS: Record<MetricKey, string> = {
  total: "Total (fin de parole → audio de Julie reçu)",
  endOfTurn: "Fin de tour (fin de parole → utterance, T1-T0)",
  generation: "Génération (utterance → Julie parle, T3-T1)",
  transport: "Transport audio (Julie parle → audio reçu, T4-T3)",
  speechStart: "Fin de parole → Julie parle (T3-T0)",
  streamingStart: "Utterance → premier signe de réponse (T2-T1)",
  streamingToSpeech: "Premier signe de réponse → Julie parle (T3-T2)",
};

const isPal = (role?: string) => role === "pal" || role === "replica";

/** Une valeur Tavus à la seconde entière est trop grossière pour mesurer une latence. */
const isHighResolution = (value: number | null): value is number =>
  value !== null && Number.isFinite(value) && !Number.isInteger(value / 1000);

function plausible(ms: number): boolean {
  return Number.isFinite(ms) && ms >= 0 && ms <= MAX_PLAUSIBLE_INTERVAL_MS;
}

/**
 * Intervalle entre deux étapes Tavus. Les horodatages Tavus sont préférés
 * lorsqu'ils sont fins et cohérents ; sinon on se rabat sur la réception locale.
 */
function interval(a: Stamp | null, b: Stamp | null): Metric {
  if (!a || !b) return { ms: null, reason: "non mesurable" };

  if (isHighResolution(a.server) && isHighResolution(b.server)) {
    const serverDelta = b.server - a.server;
    if (plausible(serverDelta)) return { ms: Math.round(serverDelta), source: "tavus" };
  }

  const localDelta = b.local - a.local;
  if (plausible(localDelta)) return { ms: Math.round(localDelta), source: "local" };
  return { ms: null, reason: localDelta < 0 ? "non mesurable (ordre impossible)" : "non mesurable (valeur aberrante)" };
}

function localInterval(from: number | null, to: number | null): Metric {
  if (from === null || to === null) return { ms: null, reason: "non mesurable" };
  const delta = to - from;
  if (delta < 0) return { ms: null, reason: "non mesurable (audio détecté avant l'événement)" };
  if (!plausible(delta)) return { ms: null, reason: "non mesurable (valeur aberrante)" };
  return { ms: Math.round(delta), source: "local" };
}

export function computeTurnMetrics(turn: TurnRecord): Record<MetricKey, Metric> {
  return {
    total: localInterval(turn.t0?.local ?? null, turn.t4),
    endOfTurn: interval(turn.t0, turn.t1),
    generation: interval(turn.t1, turn.t3),
    transport: localInterval(turn.t3?.local ?? null, turn.t4),
    speechStart: interval(turn.t0, turn.t3),
    streamingStart: interval(turn.t1, turn.t2),
    streamingToSpeech: interval(turn.t2, turn.t3),
  };
}

export interface Stats {
  count: number;
  min: number;
  median: number;
  mean: number;
  max: number;
}

export function computeStats(values: number[]): Stats | null {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((x, y) => x - y);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return {
    count: sorted.length,
    min: Math.round(sorted[0]),
    median: Math.round(median),
    mean: Math.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
    max: Math.round(sorted[sorted.length - 1]),
  };
}

export function summarise(turns: TurnRecord[]): Record<MetricKey, Stats | null> {
  const metrics = turns.map(computeTurnMetrics);
  const collect = (key: MetricKey) =>
    computeStats(metrics.map((m) => m[key]).flatMap((m) => (m.ms === null ? [] : [m.ms])));
  return {
    total: collect("total"),
    endOfTurn: collect("endOfTurn"),
    generation: collect("generation"),
    transport: collect("transport"),
    speechStart: collect("speechStart"),
    streamingStart: collect("streamingStart"),
    streamingToSpeech: collect("streamingToSpeech"),
  };
}

/* ------------------------------------------------------------------ */
/* Suivi des tours                                                     */
/* ------------------------------------------------------------------ */

const emptyTurn = (index: number): TurnRecord => ({
  index,
  turnIdx: null,
  inferenceId: null,
  t0: null,
  t1: null,
  t2: null,
  t3: null,
  t4: null,
  anomalies: [],
});

export class LatencyTracker {
  private session: LatencySession;
  private lastSeq: number | null = null;

  constructor(startedAt: string = new Date().toISOString(), restored?: LatencySession) {
    this.session = restored ?? { version: 1, startedAt, turns: [], eventCounts: {}, network: [] };
  }

  snapshot(): LatencySession {
    return {
      ...this.session,
      turns: this.session.turns.map((turn) => ({ ...turn, anomalies: [...turn.anomalies] })),
      eventCounts: { ...this.session.eventCounts },
      network: [...this.session.network],
    };
  }

  /** Tour en cours : ouvert (T0 reçu) et pas encore terminé par la parole de Julie. */
  private open(): TurnRecord | null {
    const last = this.session.turns.at(-1);
    return last && last.t0 && !last.t3 ? last : null;
  }

  private stampOf(envelope: TavusEnvelope, localMs: number): Stamp {
    return { local: localMs, server: envelope.serverTimestampMs, seq: envelope.seq };
  }

  /** Retourne `true` si l'état des tours a changé. */
  ingest(envelope: TavusEnvelope, localMs: number): boolean {
    const key = `${envelope.eventType}|${envelope.role ?? "?"}`;
    this.session.eventCounts[key] = (this.session.eventCounts[key] ?? 0) + 1;

    const outOfOrder =
      envelope.seq !== null && this.lastSeq !== null && envelope.seq < this.lastSeq;
    if (envelope.seq !== null) this.lastSeq = Math.max(this.lastSeq ?? envelope.seq, envelope.seq);

    const stamp = this.stampOf(envelope, localMs);
    const current = this.open();
    if (outOfOrder && current) current.anomalies.push("événements Tavus reçus dans le désordre (seq)");

    const { eventType, role } = envelope;

    if (eventType === "conversation.stopped_speaking" && role === "user") {
      // L'utilisateur reprend la parole avant que Julie n'ait répondu : le dernier
      // arrêt est la vraie fin de parole. Si le texte avait déjà été transmis, le
      // tour précédent reste incomplet et un nouveau tour s'ouvre.
      if (current && !current.t1) {
        current.t0 = stamp;
        if (envelope.turnIdx !== null) current.turnIdx = envelope.turnIdx;
        return true;
      }
      const turn = emptyTurn(this.session.turns.length + 1);
      turn.t0 = stamp;
      turn.turnIdx = envelope.turnIdx;
      this.session.turns.push(turn);
      return true;
    }

    if (eventType === "conversation.utterance" && role === "user") {
      if (current && !current.t1) {
        current.t1 = stamp;
        if (current.turnIdx === null) current.turnIdx = envelope.turnIdx;
        return true;
      }
      return false;
    }

    if (eventType === "conversation.utterance.streaming" && isPal(role)) {
      if (current && !current.t2) {
        current.t2 = stamp;
        current.inferenceId = envelope.inferenceId;
        return true;
      }
      return false;
    }

    if (eventType === "conversation.started_speaking" && isPal(role)) {
      // Sans tour ouvert : accueil de Julie ou doublon `replica` — non mesuré.
      if (!current) return false;
      if (current.t2 && current.inferenceId && envelope.inferenceId && current.inferenceId !== envelope.inferenceId) {
        current.anomalies.push("premier signe de réponse d'une autre inférence : écarté");
        current.t2 = null;
      }
      current.t3 = stamp;
      if (current.t4 !== null && current.t4 < localMs) {
        current.anomalies.push("audio détecté avant l'événement de début de parole");
      }
      current.inferenceId = envelope.inferenceId ?? current.inferenceId;
      if (envelope.turnIdx !== null) current.turnIdx = envelope.turnIdx;
      return true;
    }

    return true;
  }

  /** Niveau audio distant (0 à 1). Retourne `true` quand T4 est fixé. */
  ingestRemoteAudio(level: number, localMs: number): boolean {
    if (!Number.isFinite(level) || level < REMOTE_AUDIO_THRESHOLD) return false;
    const last = this.session.turns.at(-1);
    if (!last || !last.t0 || last.t4 !== null) return false;
    if (localMs < last.t0.local) return false;
    last.t4 = localMs;
    return true;
  }

  ingestNetwork(threshold: string, localMs: number): void {
    this.session.network.push({ at: localMs, threshold });
    if (this.session.network.length > 20) this.session.network.shift();
  }
}

/* ------------------------------------------------------------------ */
/* Rapport texte                                                       */
/* ------------------------------------------------------------------ */

/** « 1 640 » avec une espace ordinaire, pour un copier-coller propre. */
export function formatMs(ms: number): string {
  return `${Math.round(ms).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ms`;
}

function formatMetric(metric: Metric): string {
  return metric.ms === null ? metric.reason : `${formatMs(metric.ms)} (${metric.source === "tavus" ? "Tavus" : "local"})`;
}

function formatStats(stats: Stats | null): string {
  if (!stats) return "non mesurable";
  return `médiane ${formatMs(stats.median)} · moyenne ${formatMs(stats.mean)} · min ${formatMs(stats.min)} · max ${formatMs(stats.max)} (${stats.count} tour${stats.count > 1 ? "s" : ""})`;
}

/** Rapport transmissible : timestamps, durées et états techniques uniquement. */
export function formatLatencyReport(session: LatencySession): string {
  const turns = session.turns;
  const stats = summarise(turns);
  const lines: string[] = [];

  lines.push("LATENCE JULIE — DIAGNOSTIC");
  lines.push(`Appel démarré : ${session.startedAt}`);
  lines.push(`Tours détectés : ${turns.length}`);
  lines.push(`Tours avec latence totale exploitable : ${stats.total?.count ?? 0}`);
  lines.push("");
  lines.push("SYNTHÈSE");
  lines.push(`Total : ${formatStats(stats.total)}`);
  lines.push(`Fin de tour (T1-T0) : ${formatStats(stats.endOfTurn)}`);
  lines.push(`Génération (T3-T1) : ${formatStats(stats.generation)}`);
  lines.push(`Transport audio (T4-T3) : ${formatStats(stats.transport)}`);
  lines.push(`Fin de parole → Julie parle (T3-T0) : ${formatStats(stats.speechStart)}`);
  if (stats.streamingStart || stats.streamingToSpeech) {
    lines.push(`Utterance → premier signe de réponse (T2-T1) : ${formatStats(stats.streamingStart)}`);
    lines.push(`Premier signe de réponse → Julie parle (T3-T2) : ${formatStats(stats.streamingToSpeech)}`);
  }

  for (const turn of turns) {
    const m = computeTurnMetrics(turn);
    lines.push("");
    lines.push(`Tour ${turn.index}${turn.turnIdx !== null ? ` (turn_idx ${turn.turnIdx})` : ""}${turn.inferenceId ? ` · inference ${turn.inferenceId}` : ""}`);
    lines.push(`Fin de parole -> utterance : ${formatMetric(m.endOfTurn)}`);
    if (turn.t2 || m.streamingStart.ms !== null) {
      lines.push(`Utterance -> premier signe de réponse : ${formatMetric(m.streamingStart)}`);
      lines.push(`Premier signe de réponse -> Julie parle : ${formatMetric(m.streamingToSpeech)}`);
    }
    lines.push(`Utterance -> Julie parle : ${formatMetric(m.generation)}`);
    lines.push(`Transport audio : ${formatMetric(m.transport)}`);
    lines.push(`Fin de parole -> Julie parle : ${formatMetric(m.speechStart)}`);
    lines.push(`Total : ${formatMetric(m.total)}`);
    for (const anomaly of turn.anomalies) lines.push(`Anomalie : ${anomaly}`);
  }

  lines.push("");
  lines.push("ÉVÉNEMENTS TAVUS REÇUS (nom|rôle : nombre)");
  const counts = Object.entries(session.eventCounts);
  if (counts.length === 0) lines.push("aucun");
  for (const [key, count] of counts) lines.push(`${key} : ${count}`);

  if (session.network.length > 0) {
    lines.push("");
    lines.push("QUALITÉ RÉSEAU (changements)");
    const origin = session.network[0].at;
    for (const event of session.network) {
      lines.push(`+${Math.round((event.at - origin) / 1000)} s : ${event.threshold}`);
    }
  }

  lines.push("");
  lines.push("Aucun contenu de conversation (audio, texte, transcript) n'est collecté.");
  return lines.join("\n");
}
