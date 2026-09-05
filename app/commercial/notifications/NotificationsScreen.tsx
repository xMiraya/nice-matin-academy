"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CheckCheck, MessageSquareText } from "lucide-react";
import { DEMO_COMMERCIAL_PROFILE } from "@/src/data/demo-commercial";
import { PageHeader } from "@/src/components/PageHeader";
import { Button } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { useIsHydrated } from "@/src/lib/reports/use-reports";
import { useNotifications } from "@/src/lib/notifications/use-notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/src/lib/notifications/notification-repository";
import { cx } from "@/src/lib/format";

function formatFull(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Page dédiée aux notifications du commercial.
 *
 * Chaque notification s'ouvre ici pour être lue en entier : c'est cette page
 * que la cloche du bandeau, comme le lien envoyé par un manager, désignent
 * comme destination de lecture.
 */
export function NotificationsScreen() {
  const hydrated = useIsHydrated();
  const notifications = useNotifications(DEMO_COMMERCIAL_PROFILE.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unread = notifications.filter((notification) => !notification.read).length;

  function toggle(id: string) {
    setExpandedId((current) => (current === id ? null : id));
    markNotificationRead(id);
  }

  if (!hydrated) {
    return <div className="py-16 text-center text-sm text-graphite">Chargement…</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Notifications"
        description="Les retours de votre manager sur vos simulations arrivent ici."
        actions={
          unread > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllNotificationsRead(DEMO_COMMERCIAL_PROFILE.id)}
            >
              <CheckCheck size={15} aria-hidden />
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          image="/images/etats/aucune-notification.jpg"
          icon={<Bell size={20} aria-hidden />}
          title="Aucune notification pour le moment"
          description="Dès qu'un manager laissera un commentaire sur l'une de vos simulations, il apparaîtra ici."
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const expanded = expandedId === notification.id;
            return (
              <li key={notification.id} className="nm-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(notification.id)}
                  aria-expanded={expanded}
                  className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-mist sm:p-5"
                >
                  <span
                    className={cx(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
                      notification.read ? "bg-muted" : "bg-brand",
                    )}
                  >
                    <MessageSquareText size={17} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-ink">{notification.title}</span>
                      {!notification.read ? (
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Nouveau
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {notification.authorName} · {formatFull(notification.createdAt)}
                    </span>
                    <span
                      className={cx(
                        "mt-2 block text-sm leading-relaxed text-graphite",
                        expanded ? "whitespace-pre-line" : "line-clamp-2",
                      )}
                    >
                      {notification.message}
                    </span>
                  </span>
                </button>

                {expanded ? (
                  <div className="border-t border-line bg-mist/50 px-4 py-3.5 sm:px-5">
                    <Link
                      href={notification.href}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-accent"
                    >
                      Ouvrir la simulation concernée
                      <ArrowRight size={15} aria-hidden />
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
