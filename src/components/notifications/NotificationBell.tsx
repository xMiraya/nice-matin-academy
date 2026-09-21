"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, MessageSquareText } from "lucide-react";
import { useNotifications, useUnreadCount } from "@/src/lib/notifications/use-notifications";
import { markAllNotificationsRead, markNotificationRead } from "@/src/lib/notifications/notification-repository";
import { cx } from "@/src/lib/format";

/** « il y a 5 min », « il y a 3 h », « le 12 août ». */
function relativeTime(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

/**
 * Cloche de notifications, alimentée par la base.
 *
 * Le compte affiché reflète le nombre de notifications non lues du profil
 * connecté : commentaires du manager côté commercial, réponses du commercial
 * côté manager.
 */
export function NotificationBell({
  recipientId,
  fullPageHref,
}: {
  recipientId: string;
  fullPageHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifications = useNotifications(recipientId);
  const unread = useUnreadCount(recipientId);
  const recent = notifications.slice(0, 6);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-sm bg-line text-ink transition-colors hover:bg-brand-sky hover:text-brand"
        aria-label={`Notifications : ${unread} non lue${unread > 1 ? "s" : ""}`}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell size={17} aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger-bright px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-canvas">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-line bg-white shadow-lift">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(recipientId)}
                className="text-xs font-semibold text-brand hover:text-brand-accent"
              >
                Tout marquer comme lu
              </button>
            ) : null}
          </div>

          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-graphite">
              Aucune notification pour le moment.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {recent.map((notification) => (
                <li key={notification.id} className="border-b border-line/70 last:border-0">
                  <Link
                    href={notification.href}
                    onClick={() => {
                      markNotificationRead(notification.id);
                      setOpen(false);
                    }}
                    className={cx(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-mist",
                      !notification.read && "bg-brand-soft/60",
                    )}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <MessageSquareText size={14} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink">
                          {notification.title}
                        </span>
                        {!notification.read ? (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-graphite">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted">
                        {notification.authorName} · {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {fullPageHref ? (
            <Link
              href={fullPageHref}
              onClick={() => setOpen(false)}
              className="block border-t border-line px-4 py-2.5 text-center text-sm font-semibold text-brand hover:bg-mist"
            >
              Voir toutes les notifications
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
