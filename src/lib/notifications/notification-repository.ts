import { createRemoteStore, sendJson } from "@/src/lib/remote-store";

/**
 * Notifications de l'utilisateur connecté, stockées en base.
 *
 * Elles sont créées côté serveur (par exemple à l'ajout d'un commentaire) ;
 * le navigateur ne fait que les lire et les marquer comme lues.
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

const EMPTY: AppNotification[] = [];

const store = createRemoteStore<AppNotification[]>({
  url: "/api/notifications",
  empty: EMPTY,
  pollMs: 20_000,
  select: (json) => (json as { notifications?: AppNotification[] }).notifications ?? EMPTY,
});

export const getNotificationsSnapshot = store.getSnapshot;
export const getServerNotificationsSnapshot = store.getServerSnapshot;
export const subscribeToNotifications = store.subscribe;
export const getNotificationsLoaded = store.getLoaded;
export const getServerNotificationsLoaded = store.getServerLoaded;

/** Marque une notification comme lue. */
export function markNotificationRead(id: string): void {
  store.setLocal(
    store.getSnapshot().map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
  void sendJson("/api/notifications", "PATCH", { id }).then(store.refresh, store.refresh);
}

/** Marque toutes les notifications de l'utilisateur comme lues. */
export function markAllNotificationsRead(recipientId: string): void {
  store.setLocal(
    store
      .getSnapshot()
      .map((item) => (item.recipientId === recipientId ? { ...item, read: true } : item)),
  );
  void sendJson("/api/notifications", "PATCH", { all: true }).then(store.refresh, store.refresh);
}
