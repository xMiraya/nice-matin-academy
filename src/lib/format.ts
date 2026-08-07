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
  if (score >= 70) return "#22a06b";
  if (score >= 55) return "#377dff";
  if (score >= 40) return "#f59e0b";
  return "#dc3545";
}

/** Classes Tailwind associées à un niveau de score. */
export function scoreToneClasses(score: number): string {
  if (score >= 70) return "bg-positive/10 text-positive";
  if (score >= 55) return "bg-info/10 text-info";
  if (score >= 40) return "bg-warning/15 text-[#9a6206]";
  return "bg-danger/10 text-danger";
}
