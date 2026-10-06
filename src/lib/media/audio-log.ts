/**
 * Journal technique audio, côté navigateur.
 *
 * Uniquement des états (permission, piste, mute, erreur) : jamais de contenu
 * vocal, de libellé de périphérique, de clé ni de donnée personnelle.
 */
export type AudioLogDetails = Record<string, string | number | boolean | null | undefined>;

export function logAudio(event: string, details: AudioLogDetails = {}): void {
  if (typeof console === "undefined") return;
  console.info(`[audio] ${event}`, details);
}
