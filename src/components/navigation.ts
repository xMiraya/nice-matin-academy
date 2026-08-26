import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Radar,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type WorkspaceRole = "commercial" | "manager";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Rubrique de maquette non encore reliée à une page complète. */
  soon?: boolean;
}

export interface NavGroup {
  /** Intitulé de la famille de rubriques, affiché en micro-libellé. */
  label: string;
  items: NavItem[];
}

/**
 * Navigation regroupée par intention.
 *
 * Le commercial sépare ce qu'il fait (s'entraîner) de ce qu'il consulte
 * (progresser). Le manager sépare le pilotage quotidien du suivi individuel.
 */
export const NAVIGATION_GROUPS: Record<WorkspaceRole, NavGroup[]> = {
  commercial: [
    {
      label: "S'entraîner",
      items: [
        { href: "/commercial", label: "Vue d'ensemble", icon: LayoutDashboard },
        { href: "/commercial/nouvelle-simulation", label: "Nouvelle simulation", icon: Video },
        { href: "/commercial/simulations", label: "Mes simulations", icon: ClipboardList },
      ],
    },
    {
      label: "Progresser",
      items: [
        { href: "/commercial/progression", label: "Progression", icon: TrendingUp },
        { href: "/commercial/ressources", label: "Ressources", icon: BookOpen },
      ],
    },
  ],
  manager: [
    {
      label: "Piloter",
      items: [
        { href: "/manager", label: "Vue équipe", icon: LayoutDashboard },
        { href: "/manager/simulations", label: "Simulations", icon: ClipboardList },
      ],
    },
    {
      label: "Accompagner",
      items: [
        { href: "/manager/commerciaux", label: "Commerciaux", icon: Users },
        { href: "/manager/competences", label: "Compétences", icon: Radar },
      ],
    },
    {
      label: "Rendre compte",
      items: [{ href: "/manager/rapports", label: "Rapports", icon: FileBarChart }],
    },
  ],
};

/** Liste à plat des mêmes rubriques, utilisée par la navigation mobile. */
export const NAVIGATION: Record<WorkspaceRole, NavItem[]> = {
  commercial: NAVIGATION_GROUPS.commercial.flatMap((group) => group.items),
  manager: NAVIGATION_GROUPS.manager.flatMap((group) => group.items),
};

export const WORKSPACE_LABEL: Record<WorkspaceRole, string> = {
  commercial: "Espace commercial",
  manager: "Espace manager",
};

export const WORKSPACE_ICON: Record<WorkspaceRole, LucideIcon> = {
  commercial: Video,
  manager: BarChart3,
};

/** Détermine l'entrée active, en tenant compte des sous-routes. */
export function isNavItemActive(itemHref: string, pathname: string): boolean {
  if (itemHref === "/commercial" || itemHref === "/manager") {
    return pathname === itemHref;
  }
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}

/** Libellé de la rubrique courante, pour le fil d'ariane du bandeau. */
export function currentNavLabel(role: WorkspaceRole, pathname: string): string | null {
  const match = NAVIGATION[role].find((item) => isNavItemActive(item.href, pathname));
  return match?.label ?? null;
}
