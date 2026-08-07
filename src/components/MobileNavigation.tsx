"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION, WORKSPACE_LABEL, isNavItemActive } from "@/src/components/navigation";
import type { WorkspaceRole } from "@/src/components/navigation";
import { cx } from "@/src/lib/format";

/**
 * Navigation principale en bas d'écran sur mobile et tablette.
 * Les mêmes rubriques que la barre latérale sont proposées.
 */
export function MobileNavigation({ role }: { role: WorkspaceRole }) {
  const pathname = usePathname();
  const items = NAVIGATION[role];

  return (
    <nav
      aria-label={`${WORKSPACE_LABEL[role]} — navigation mobile`}
      className="sticky bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur-[2px] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-full flex-col items-center gap-1 px-1 py-2.5 text-center text-[10px] font-medium leading-tight transition-colors",
                  active ? "text-brand" : "text-graphite",
                )}
              >
                <Icon size={19} aria-hidden />
                <span className="line-clamp-2">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
