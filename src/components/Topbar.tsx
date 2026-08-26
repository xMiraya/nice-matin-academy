"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Search } from "lucide-react";
import type { UserProfile } from "@/src/types";
import { Logo } from "@/src/components/Logo";
import { Avatar } from "@/src/components/Avatar";
import { WORKSPACE_LABEL, currentNavLabel } from "@/src/components/navigation";
import type { WorkspaceRole } from "@/src/components/navigation";
import { cx } from "@/src/lib/format";

interface TopbarProps {
  role: WorkspaceRole;
  profile: UserProfile;
  /** Nombre de notifications factices affichées sur la cloche. */
  notificationsCount?: number;
}

const WORKSPACES: { role: WorkspaceRole; href: string; label: string }[] = [
  { role: "commercial", href: "/commercial", label: "Commercial" },
  { role: "manager", href: "/manager", label: "Manager" },
];

/**
 * Bascule entre les deux espaces de la maquette.
 *
 * Elle remplace le passage obligé par l'écran de connexion : en démonstration,
 * on compare très souvent la vue du commercial et celle de sa direction.
 */
function WorkspaceSwitch({ role }: { role: WorkspaceRole }) {
  return (
    <div
      className="hidden items-center gap-0.5 rounded-sm bg-mist p-1 md:flex"
      role="group"
      aria-label="Changer d'espace"
    >
      {WORKSPACES.map((workspace) => {
        const active = workspace.role === role;
        return (
          <Link
            key={workspace.role}
            href={workspace.href}
            aria-current={active ? "true" : undefined}
            className={cx(
              "rounded-xs px-3 py-1.5 text-xs font-semibold transition-colors",
              active ? "bg-white text-brand shadow-card" : "text-graphite hover:text-ink",
            )}
          >
            {workspace.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Bandeau supérieur : repère de navigation, recherche, espace courant, profil. */
export function Topbar({ role, profile, notificationsCount = 2 }: TopbarProps) {
  const pathname = usePathname();
  const section = currentNavLabel(role, pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/connexion" className="lg:hidden" aria-label="Nice-Matin Academy — accueil">
            <Logo size="sm" />
          </Link>

          <nav aria-label="Fil d'ariane" className="hidden min-w-0 items-center gap-1.5 lg:flex">
            <span className="text-sm font-medium text-graphite">{WORKSPACE_LABEL[role]}</span>
            {section ? (
              <>
                <ChevronRight size={14} className="text-muted" aria-hidden />
                <span className="truncate text-sm font-semibold text-ink">{section}</span>
              </>
            ) : null}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden items-center gap-2.5 rounded-sm border border-line bg-white py-2 pl-3 pr-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-graphite xl:flex"
            title="Recherche — démonstration"
            aria-label="Rechercher (démonstration, non connectée)"
          >
            <Search size={15} aria-hidden />
            <span className="w-40 text-left">Rechercher…</span>
            <kbd className="rounded-xs border border-line bg-mist px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted">
              ⌘K
            </kbd>
          </button>

          <WorkspaceSwitch role={role} />

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-sm border border-line bg-white text-graphite transition-colors hover:border-line-strong hover:text-brand"
            aria-label={`Notifications de démonstration : ${notificationsCount} non lues`}
            title="Notifications — démonstration"
          >
            <Bell size={17} aria-hidden />
            {notificationsCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger-bright px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-canvas">
                {notificationsCount}
              </span>
            ) : null}
          </button>

          <div className="flex items-center gap-2.5 rounded-sm border border-line bg-white p-1 pr-3">
            <Avatar initials={profile.initials} size="sm" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-semibold text-ink">
                {profile.firstName} {profile.lastName}
              </span>
              <span className="block text-[11px] text-graphite">{profile.team}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
