import type { TrackLike } from "@/src/lib/media/microphone";

/**
 * État réel du microphone pendant l'appel, déduit de la piste locale publiée
 * dans Daily : jamais d'un booléen d'interface.
 *
 * - pending : connexion en cours, la piste n'est pas encore établie ;
 * - active  : piste présente, jouable, vivante, activée et non coupée ;
 * - muted   : coupé volontairement par l'utilisateur ;
 * - lost    : l'utilisateur veut parler mais aucune piste exploitable n'est publiée.
 */
export type MicRuntime = "pending" | "active" | "muted" | "lost";

/** États de piste Daily (`participant.tracks.audio.state`). */
export type DailyTrackStateName = "blocked" | "off" | "sendable" | "loading" | "interrupted" | "playable";

export interface MicRuntimeInput {
  /** `joined-meeting` reçu. */
  joined: boolean;
  /** L'utilisateur souhaite parler (bouton non coupé). */
  wanted: boolean;
  /** Délai de mise en route écoulé : au-delà, une piste absente est une perte. */
  settled: boolean;
  /** État Daily de la piste audio locale, `undefined` si absente. */
  trackState: DailyTrackStateName | undefined;
  /** Piste média locale sous-jacente, si Daily la fournit. */
  track: TrackLike | null;
}

export function deriveMicRuntime(input: MicRuntimeInput): MicRuntime {
  if (!input.joined) return "pending";
  if (!input.wanted) return "muted";

  const unresolved: MicRuntime = input.settled ? "lost" : "pending";

  switch (input.trackState) {
    case "playable": {
      if (!input.track) return "active";
      if (input.track.readyState !== "live") return "lost";
      if (!input.track.enabled || input.track.muted) return unresolved;
      return "active";
    }
    case "interrupted":
    case "blocked":
      return "lost";
    case "loading":
    case "sendable":
    case "off":
    default:
      return unresolved;
  }
}
