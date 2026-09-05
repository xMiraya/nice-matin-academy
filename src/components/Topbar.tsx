"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { UserProfile } from "@/src/types";
import { Logo } from "@/src/components/Logo";
import { Avatar } from "@/src/components/Avatar";
import { GlobalSearch } from "@/src/components/search/GlobalSearch";
import { NotificationBell } from "@/src/components/notifications/NotificationBell";
import { WORKSPACE_LABEL, currentNavLabel } from "@/src/components/navigation";
import type { WorkspaceRole } from "@/src/components/navigation";
import { cx } from "@/src/lib/format";

interface TopbarProps {
  role: WorkspaceRole;
  profile: UserProfile;
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
export function Topbar({ role, profile }: TopbarProps) {
  const pathname = usePathname();
  const section = currentNavLabel(role, pathname);

  return (
    <header
      data-app-chrome
      className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/connexion" className="lg:hidden" aria-label="Nice-Matin Academy, accueil">
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
          <GlobalSearch role={role} />

          <WorkspaceSwitch role={role} />

          <NotificationBell
            recipientId={profile.id}
            fullPageHref={role === "commercial" ? "/commercial/notifications" : undefined}
          />

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
