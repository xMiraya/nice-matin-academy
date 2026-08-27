/**
 * Generateur pseudo-aleatoire deterministe (mulberry32).
 * Une graine explicite rend les tirages reproductibles dans les tests, tout en
 * restant aleatoires en production (graine = horodatage).
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Melange une liste sans muter l'entree (Fisher-Yates). */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/** Tire au maximum `count` elements distincts. */
export function sample<T>(items: readonly T[], count: number, rng: () => number = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, Math.min(count, items.length)));
}
