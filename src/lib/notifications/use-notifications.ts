"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getNotificationsSnapshot,
  getServerNotificationsSnapshot,
  subscribeToNotifications,
} from "@/src/lib/notifications/notification-repository";
import type { AppNotification } from "@/src/lib/notifications/notification-repository";

/** Toutes les notifications enregistrées sur cet appareil, tous destinataires confondus. */
function useAllNotifications(): AppNotification[] {
  return useSyncExternalStore(
    subscribeToNotifications,
    getNotificationsSnapshot,
    getServerNotificationsSnapshot,
  );
}

/** Notifications d'un destinataire donné, plus récentes en premier. */
export function useNotifications(recipientId: string): AppNotification[] {
  const all = useAllNotifications();
  return useMemo(
    () => all.filter((notification) => notification.recipientId === recipientId),
    [all, recipientId],
  );
}

/** Nombre de notifications non lues d'un destinataire. */
export function useUnreadCount(recipientId: string): number {
  const notifications = useNotifications(recipientId);
  return notifications.filter((notification) => !notification.read).length;
}
