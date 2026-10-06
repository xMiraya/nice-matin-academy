import type { LatencySession, NetworkEvent, Stamp, TurnRecord } from "@/src/lib/tavus/latency-turns";

/**
 * Activation et conservation temporaire des mesures de latence, côté navigateur.
 *
 * Désactivé par défaut. Activation explicite par `?latencyDebug=1` ; la
 * désactivation se fait par `?latencyDebug=0` ou par le bouton du panneau.
 * L'activation est mémorisée dans `sessionStorage` pour survivre à la
 * navigation vers /commercial/analyse. Rien n'est stocké en base.
 */

export const LATENCY_FLAG_KEY = "nm:latency-debug";
export const LATENCY_REPORT_KEY = "nm:latency-debug:report";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function safe<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch {
    return fallback;
  }
}

/** Décide de l'activation à partir de l'URL et du stockage, sans effet de bord caché. */
export function resolveLatencyDebug(search: string, storage: StorageLike | null): boolean {
  const param = safe(() => new URLSearchParams(search).get("latencyDebug"), null);

  if (param === "1") {
    safe(() => storage?.setItem(LATENCY_FLAG_KEY, "1"), undefined);
    return true;
  }
  if (param === "0") {
    safe(() => storage?.removeItem(LATENCY_FLAG_KEY), undefined);
    safe(() => storage?.removeItem(LATENCY_REPORT_KEY), undefined);
    return false;
  }
  return safe(() => storage?.getItem(LATENCY_FLAG_KEY) === "1", false);
}

/** Activation effective dans le navigateur courant. Toujours `false` côté serveur. */
export function isLatencyDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return resolveLatencyDebug(
    safe(() => window.location.search, ""),
    safe(() => window.sessionStorage, null),
  );
}

/* ------------------------------------------------------------------ */
/* Nettoyage : seuls les champs techniques connus sont conservés        */
/* ------------------------------------------------------------------ */

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const str = (value: unknown): string | null => (typeof value === "string" ? value.slice(0, 80) : null);
const obj = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

function cleanStamp(value: unknown): Stamp | null {
  const raw = obj(value);
  const local = raw ? num(raw.local) : null;
  if (!raw || local === null) return null;
  return { local, server: num(raw.server), seq: num(raw.seq) };
}

/**
 * Reconstruit une session à partir de données non fiables en ne gardant que
 * les champs techniques attendus : tout autre champ (par exemple un texte) est
 * écarté.
 */
export function sanitizeSession(raw: unknown): LatencySession | null {
  const data = obj(raw);
  if (!data || data.version !== 1 || !Array.isArray(data.turns)) return null;

  const turns: TurnRecord[] = [];
  for (const item of data.turns.slice(0, 200)) {
    const turn = obj(item);
    const index = turn ? num(turn.index) : null;
    if (!turn || index === null) continue;
    turns.push({
      index,
      turnIdx: num(turn.turnIdx),
      inferenceId: str(turn.inferenceId),
      t0: cleanStamp(turn.t0),
      t1: cleanStamp(turn.t1),
      t2: cleanStamp(turn.t2),
      t3: cleanStamp(turn.t3),
      t4: num(turn.t4),
      anomalies: Array.isArray(turn.anomalies)
        ? turn.anomalies.slice(0, 10).flatMap((entry) => (typeof entry === "string" ? [entry.slice(0, 120)] : []))
        : [],
    });
  }

  const eventCounts: Record<string, number> = {};
  const counts = obj(data.eventCounts);
  if (counts) {
    for (const [key, value] of Object.entries(counts).slice(0, 40)) {
      const count = num(value);
      if (count !== null) eventCounts[key.slice(0, 80)] = count;
    }
  }

  const network: NetworkEvent[] = [];
  if (Array.isArray(data.network)) {
    for (const item of data.network.slice(0, 20)) {
      const event = obj(item);
      const at = event ? num(event.at) : null;
      const threshold = event ? str(event.threshold) : null;
      if (at !== null && threshold) network.push({ at, threshold });
    }
  }

  return { version: 1, startedAt: str(data.startedAt) ?? "", turns, eventCounts, network };
}

export function saveLatencySession(storage: StorageLike | null, session: LatencySession): void {
  safe(() => storage?.setItem(LATENCY_REPORT_KEY, JSON.stringify(session)), undefined);
}

export function loadLatencySession(storage: StorageLike | null): LatencySession | null {
  const raw = safe(() => storage?.getItem(LATENCY_REPORT_KEY) ?? null, null);
  if (!raw) return null;
  return safe(() => sanitizeSession(JSON.parse(raw)), null);
}

export function clearLatencySession(storage: StorageLike | null): void {
  safe(() => storage?.removeItem(LATENCY_REPORT_KEY), undefined);
}

/* ------------------------------------------------------------------ */
/* Magasin réactif pour le panneau de diagnostic                       */
/* ------------------------------------------------------------------ */

type Listener = () => void;
const listeners = new Set<Listener>();
let current: LatencySession | null = null;
let loaded = false;

const browserStorage = (): StorageLike | null =>
  typeof window === "undefined" ? null : safe(() => window.sessionStorage, null);

export function subscribeLatency(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Dernière session connue, relue du stockage au premier accès. Référence stable entre deux mises à jour. */
export function getLatencySnapshot(): LatencySession | null {
  if (!loaded) {
    loaded = true;
    current = loadLatencySession(browserStorage());
  }
  return current;
}

export function publishLatencySession(session: LatencySession): void {
  loaded = true;
  current = session;
  saveLatencySession(browserStorage(), session);
  listeners.forEach((listener) => listener());
}

/** Efface les mesures conservées (mémoire et stockage). */
export function clearLatencyMeasurements(): void {
  loaded = true;
  current = null;
  clearLatencySession(browserStorage());
  listeners.forEach((listener) => listener());
}

/** Désactive le mode diagnostic et efface les mesures. */
export function disableLatencyDebug(): void {
  safe(() => browserStorage()?.removeItem(LATENCY_FLAG_KEY), undefined);
  clearLatencyMeasurements();
}
