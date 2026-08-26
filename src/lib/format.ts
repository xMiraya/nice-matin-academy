import type { SessionDifficulty, SessionStatus } from "@/src/types";

/** Concatène des classes conditionnelles sans dépendance externe. */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

/** « 6 août 2026 » à partir d'une date ISO. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T12:00:00`));
}

/** « 06/08/26 » à partir d'une date ISO. */
export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(`${iso}T12:00:00`));
}

/** Durée en secondes vers « 2 min 09 s ». */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) {
    return `${rest} s`;
  }
  return `${minutes} min ${String(rest).padStart(2, "0")} s`;
}

/** Durée en secondes vers « 02:09 ». */
export function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** Ajoute le signe devant une variation. */
export function formatDelta(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export const STATUS_LABELS: Record<SessionStatus, string> = {
  terminee: "Terminée",
  "en-analyse": "En analyse",
  "a-refaire": "À refaire",
};

export const DIFFICULTY_LABELS: Record<SessionDifficulty, string> = {
  facile: "Facile",
  intermediaire: "Intermédiaire",
  difficile: "Difficile",
};

/** Couleur de score cohérente sur toute l'application. */
export function scoreColor(score: number): string {
  if (score >= 70) return "#10b981";
  if (score >= 55) return "#0a4aab";
  if (score >= 40) return "#e0940b";
  return "#e30613";
}

/** Classes Tailwind associées à un niveau de score. */
export function scoreToneClasses(score: number): string {
  if (score >= 70) return "bg-positive-soft text-positive";
  if (score >= 55) return "bg-info-soft text-info";
  if (score >= 40) return "bg-warning-soft text-warning";
  return "bg-danger-soft text-danger";
}

/** Libellé qualitatif d'un score, pour accompagner le chiffre brut. */
export function scoreLabel(score: number): string {
  if (score >= 70) return "Solide";
  if (score >= 55) return "En progression";
  if (score >= 40) return "En construction";
  return "À travailler";
}
