"use client";

import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import type { UserProfile } from "@/src/types";
import { Logo } from "@/src/components/Logo";
import { WORKSPACE_LABEL } from "@/src/components/navigation";
import type { WorkspaceRole } from "@/src/components/navigation";

interface TopbarProps {
  role: WorkspaceRole;
  profile: UserProfile;
  /** Nombre de notifications factices affichées sur la cloche. */
  notificationsCount?: number;
}

/** Bandeau supérieur : espace courant, profil connecté, notifications, sortie. */
export function Topbar({ role, profile, notificationsCount = 2 }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-[2px]">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/connexion" className="lg:hidden" aria-label="Nice-Matin Academy — accueil">
            <Logo size="sm" />
          </Link>
          <div className="hidden min-w-0 lg:block">
            <p className="nm-label">{WORKSPACE_LABEL[role]}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-ink">
              {profile.team} — entraînement commercial
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-line text-graphite transition-colors hover:bg-mist hover:text-ink"
            aria-label={`Notifications de démonstration : ${notificationsCount} non lues`}
            title="Notifications — démonstration"
          >
            <Bell size={17} aria-hidden />
            {notificationsCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-none text-white">
                {notificationsCount}
              </span>
            ) : null}
          </button>

          <div className="flex items-center gap-2.5 rounded-sm border border-line py-1 pl-1 pr-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-ink text-[11px] font-semibold text-white">
              {profile.initials}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-semibold text-ink">
                {profile.firstName} {profile.lastName}
              </span>
              <span className="block text-[11px] text-graphite">{profile.role}</span>
            </span>
          </div>

          <Link
            href="/connexion"
            className="flex h-9 items-center gap-2 rounded-sm border border-line px-3 text-sm font-medium text-graphite transition-colors hover:bg-mist hover:text-ink"
            title="Déconnexion de démonstration"
          >
            <LogOut size={16} aria-hidden />
            <span className="hidden sm:inline">Déconnexion</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
