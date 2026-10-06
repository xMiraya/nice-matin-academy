import type { MicFailure, MicVerdict } from "@/src/lib/media/microphone";

export type GatedStart<T> =
  | { started: true; value: T }
  | { started: false; failure: MicFailure };

/**
 * Garde de lancement : la conversation Tavus (facturée) n'est créée que si le
 * contrôle technique du microphone réussit. En cas d'échec, `create` n'est
 * jamais appelée.
 */
export async function createConversationIfMicReady<T>(deps: {
  verify: () => Promise<MicVerdict>;
  create: () => Promise<T>;
}): Promise<GatedStart<T>> {
  let verdict: MicVerdict;
  try {
    verdict = await deps.verify();
  } catch {
    return { started: false, failure: "error" };
  }
  if (!verdict.ok) return { started: false, failure: verdict.failure };
  return { started: true, value: await deps.create() };
}
