"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { UserProfile } from "@/src/types";
import { Logo } from "@/src/components/Logo";
import { NAVIGATION, WORKSPACE_LABEL, isNavItemActive } from "@/src/components/navigation";
import type { WorkspaceRole } from "@/src/components/navigation";
import { cx } from "@/src/lib/format";

interface AppSidebarProps {
  role: WorkspaceRole;
  profile: UserProfile;
}

/** Barre latérale de navigation, affichée à partir du format ordinateur. */
export function AppSidebar({ role, profile }: AppSidebarProps) {
  const pathname = usePathname();
  const items = NAVIGATION[role];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white lg:flex">
      <div className="border-b border-line px-6 py-6">
        <Link href="/connexion" aria-label="Nice-Matin Academy — accueil">
          <Logo size="sm" />
        </Link>
      </div>

      <nav aria-label={WORKSPACE_LABEL[role]} className="flex-1 overflow-y-auto px-3 py-5">
        <p className="nm-label px-3 pb-3">{WORKSPACE_LABEL[role]}</p>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-soft text-brand-dark"
                      : "text-graphite hover:bg-mist hover:text-ink",
                  )}
                >
                  <Icon size={17} aria-hidden className={active ? "text-brand" : ""} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3 rounded-sm bg-mist px-3 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink text-xs font-semibold text-white">
            {profile.initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">
              {profile.firstName} {profile.lastName}
            </span>
            <span className="block truncate text-xs text-graphite">{profile.role}</span>
          </span>
        </div>
        <Link
          href="/connexion"
          className="mt-3 flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-graphite transition-colors hover:bg-mist hover:text-ink"
        >
          <LogOut size={16} aria-hidden />
          Déconnexion (démonstration)
        </Link>
      </div>
    </aside>
  );
}
