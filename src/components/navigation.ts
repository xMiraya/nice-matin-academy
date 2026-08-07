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

export const NAVIGATION: Record<WorkspaceRole, NavItem[]> = {
  commercial: [
    { href: "/commercial", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/commercial/nouvelle-simulation", label: "Nouvelle simulation", icon: Video },
    { href: "/commercial/simulations", label: "Mes simulations", icon: ClipboardList },
    { href: "/commercial/progression", label: "Progression", icon: TrendingUp },
    { href: "/commercial/ressources", label: "Ressources", icon: BookOpen },
  ],
  manager: [
    { href: "/manager", label: "Vue équipe", icon: LayoutDashboard },
    { href: "/manager/commerciaux", label: "Commerciaux", icon: Users },
    { href: "/manager/simulations", label: "Simulations", icon: ClipboardList },
    { href: "/manager/competences", label: "Compétences", icon: Radar },
    { href: "/manager/rapports", label: "Rapports", icon: FileBarChart },
  ],
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
