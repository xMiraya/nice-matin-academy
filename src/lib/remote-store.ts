"use client";

/**
 * Magasin de données synchronisé avec le serveur.
 *
 * Compatible `useSyncExternalStore` : la référence de l'instantané ne change que
 * si le contenu change. Les données sont relues à l'abonnement, au retour sur
 * l'onglet et à intervalle régulier, de sorte qu'un commentaire du manager
 * apparaît chez le commercial sans rechargement manuel.
 */

export interface RemoteStore<T> {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  getLoaded: () => boolean;
  getServerLoaded: () => boolean;
  subscribe: (listener: () => void) => () => void;
  /** Relit le serveur maintenant. */
  refresh: () => Promise<void>;
  /** Remplace localement la valeur (mise à jour optimiste). */
  setLocal: (value: T) => void;
}

interface Options<T> {
  url: string;
  select: (json: unknown) => T;
  empty: T;
  pollMs?: number;
}

export function createRemoteStore<T>({ url, select, empty, pollMs = 30_000 }: Options<T>): RemoteStore<T> {
  let value = empty;
  let serialized = JSON.stringify(empty);
  let loaded = false;
  let inflight: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = () => {
    for (const listener of listeners) listener();
  };

  function apply(next: T) {
    const nextSerialized = JSON.stringify(next);
    const changed = nextSerialized !== serialized;
    if (changed) {
      value = next;
      serialized = nextSerialized;
    }
    if (changed || !loaded) {
      loaded = true;
      emit();
    }
  }

  function refresh(): Promise<void> {
    if (typeof window === "undefined") return Promise.resolve();
    inflight ??= fetch(url, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/connexion";
          return;
        }
        if (!response.ok) return;
        apply(select(await response.json()));
      })
      .catch(() => {
        // Hors ligne : on garde la dernière valeur connue.
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }

  const onFocus = () => void refresh();
  const onVisibility = () => {
    if (document.visibilityState === "visible") void refresh();
  };

  return {
    getSnapshot: () => value,
    getServerSnapshot: () => empty,
    getLoaded: () => loaded,
    getServerLoaded: () => false,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && typeof window !== "undefined") {
        void refresh();
        timer = setInterval(() => void refresh(), pollMs);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== "undefined") {
          if (timer) clearInterval(timer);
          timer = null;
          window.removeEventListener("focus", onFocus);
          document.removeEventListener("visibilitychange", onVisibility);
        }
      };
    },
    refresh,
    setLocal: apply,
  };
}

/** Appel JSON d'écriture ; lève une erreur lisible si le serveur refuse. */
export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(json.error ?? "L'opération a échoué.");
  return json as T;
}
