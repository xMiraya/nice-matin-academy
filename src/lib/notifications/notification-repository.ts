import { z } from "zod";

/**
 * Couche de stockage des notifications.
 *
 * Même avertissement que pour les comptes rendus du Coach (voir
 * `src/lib/reports/report-repository.ts`) : ce stockage navigateur est adapté
 * à une démonstration locale, pas à un usage multi-appareil ou durable. Une
 * notification créée sur le poste du manager n'apparaît que sur ce poste —
 * dans cette maquette, elle est donc écrite dans le même navigateur que celui
 * qui la consulte, ce qui suffit à démontrer le mécanisme de bout en bout.
 */

export type NotificationKind = "coach-comment";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Identifiant du profil destinataire (`UserProfile.id`). */
  recipientId: string;
  /** Nom affiché de l'auteur, par exemple le manager qui commente. */
  authorName: string;
  title: string;
  message: string;
  /** Lien vers l'écran où lire le contenu complet. */
  href: string;
  createdAt: string;
  read: boolean;
}

const NotificationSchema = z.object({
  id: z.string(),
  kind: z.enum(["coach-comment"]),
  recipientId: z.string(),
  authorName: z.string(),
  title: z.string(),
  message: z.string(),
  href: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
});

const STORAGE_KEY = "niceMatinNotifications";
const CHANGE_EVENT = "nicematin:notifications-changed";

const EMPTY: AppNotification[] = [];

let cachedRaw: string | null = null;
let cachedNotifications: AppNotification[] = EMPTY;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parse(raw: string | null): AppNotification[] {
  if (!raw) return EMPTY;
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(parsedJson)) return EMPTY;

  const notifications: AppNotification[] = [];
  for (const item of parsedJson) {
    const result = NotificationSchema.safeParse(item);
    if (result.success) notifications.push(result.data);
  }
  return notifications.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function notifyChange(): void {
  cachedRaw = null;
  for (const listener of listeners) listener();
}

export function getNotificationsSnapshot(): AppNotification[] {
  if (!isBrowser()) return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedNotifications = parse(raw);
  }
  return cachedNotifications;
}

export function getServerNotificationsSnapshot(): AppNotification[] {
  return EMPTY;
}

export function subscribeToNotifications(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) notifyChange();
  };
  const onLocalChange = () => listener();
  if (isBrowser()) {
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onLocalChange);
  }
  return () => {
    listeners.delete(listener);
    if (isBrowser()) {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onLocalChange);
    }
  };
}

function persist(next: AppNotification[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyChange();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Crée une notification et la range en tête de liste. */
export function pushNotification(input: Omit<AppNotification, "id" | "createdAt" | "read">): void {
  if (!isBrowser()) return;
  const notification: AppNotification = {
    ...input,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  persist([notification, ...getNotificationsSnapshot()]);
}

/** Marque une notification comme lue. */
export function markNotificationRead(id: string): void {
  if (!isBrowser()) return;
  const next = getNotificationsSnapshot().map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
  persist(next);
}

/** Marque toutes les notifications d'un destinataire comme lues. */
export function markAllNotificationsRead(recipientId: string): void {
  if (!isBrowser()) return;
  const next = getNotificationsSnapshot().map((notification) =>
    notification.recipientId === recipientId ? { ...notification, read: true } : notification,
  );
  persist(next);
}
