"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Video } from "lucide-react";
import type { UserProfile } from "@/src/types";
import { Logo } from "@/src/components/Logo";
import { LogoutButton } from "@/src/components/LogoutButton";
import { Avatar } from "@/src/components/Avatar";
import {
  NAVIGATION_GROUPS,
  WORKSPACE_LABEL,
  isNavItemActive,
} from "@/src/components/navigation";
import type { WorkspaceRole } from "@/src/components/navigation";
import { cx } from "@/src/lib/format";

interface AppSidebarProps {
  role: WorkspaceRole;
  profile: UserProfile;
}

/** Encart d'appel à l'action au pied de la barre latérale du commercial. */
function TrainingPrompt() {
  return (
    <div className="nm-navy relative overflow-hidden rounded-lg p-4">
      <span
        aria-hidden
        className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-brand-sky/15 blur-xl"
      />
      <span className="relative flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-sky">
        <Sparkles size={12} aria-hidden />
        Coach IA
      </span>
      <p className="relative mt-2 text-sm font-semibold leading-snug text-white">
        Dix minutes suffisent pour une simulation complète.
      </p>
      <Link
        href="/commercial/nouvelle-simulation"
        className="relative mt-3.5 flex items-center justify-center gap-2 rounded-sm bg-white px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-sky"
      >
        <Video size={15} aria-hidden />
        Lancer un appel
      </Link>
    </div>
  );
}

/** Barre latérale de navigation, affichée à partir du format ordinateur. */
export function AppSidebar({ role, profile }: AppSidebarProps) {
  const pathname = usePathname();
  const groups = NAVIGATION_GROUPS[role];

  return (
    <aside data-app-chrome className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-white lg:flex">
      <div className="px-5 py-6">
        <Link href="/connexion" aria-label="Nice-Matin Academy, accueil">
          <Logo size="sm" />
        </Link>
      </div>

      <nav
        aria-label={WORKSPACE_LABEL[role]}
        className="nm-scroll flex-1 overflow-y-auto px-3 pb-4"
      >
        {groups.map((group) => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="nm-label px-3 pb-2.5">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "group flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-brand font-semibold text-white shadow-card"
                          : "font-medium text-graphite hover:bg-mist hover:text-ink",
                      )}
                    >
                      <Icon
                        size={17}
                        aria-hidden
                        className={active ? "text-brand-sky" : "text-muted group-hover:text-brand"}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-line p-3">
        {role === "commercial" ? <TrainingPrompt /> : null}

        <div className="flex items-center gap-3 rounded-lg bg-mist px-3 py-2.5">
          <Avatar initials={profile.initials} photo={profile.photo} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {profile.firstName} {profile.lastName}
            </span>
            <span className="block truncate text-xs text-graphite">{profile.role}</span>
          </span>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
