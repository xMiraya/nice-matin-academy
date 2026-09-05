import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { DEMO_COMMERCIAL_DASHBOARD } from "@/src/data/demo-commercial";
import { COMPETENCIES } from "@/src/data/competencies";
import { methodologySheets } from "@/src/data/methodology/sheets";
import { COMPETENCIES as QCM_COMPETENCIES } from "@/src/data/qcm/competencies";
import { qcmRoutes } from "@/src/data/qcm/routes";
import { NAVIGATION } from "@/src/components/navigation";

export interface SearchItem {
  label: string;
  description?: string;
  href: string;
  group: string;
}

/**
 * Index de recherche de l'espace manager.
 *
 * Construit à partir des données déjà présentes côté client (équipe,
 * compétences, navigation) : aucune requête réseau, la recherche répond
 * instantanément à chaque frappe.
 */
export function managerSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  for (const item of NAVIGATION.manager) {
    items.push({ label: item.label, href: item.href, group: "Pages" });
  }

  for (const member of DEMO_MANAGER_DASHBOARD.members) {
    const name = `${member.profile.firstName} ${member.profile.lastName}`;
    items.push({
      label: name,
      description: `${member.profile.team}, ${member.averageScore} / 100 en moyenne`,
      href: member.href ?? "/manager/commerciaux",
      group: "Commerciaux",
    });
  }

  for (const competency of COMPETENCIES) {
    items.push({
      label: competency.label,
      description: competency.description,
      href: "/manager/competences",
      group: "Compétences",
    });
  }

  for (const session of DEMO_MANAGER_DASHBOARD.recentSessions) {
    items.push({
      label: session.title,
      description: session.repName ? `Simulation de ${session.repName}` : "Simulation",
      href: "/manager/simulations",
      group: "Simulations",
    });
  }

  return items;
}

/** Index de recherche de l'espace commercial. */
export function commercialSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  for (const item of NAVIGATION.commercial) {
    items.push({ label: item.label, href: item.href, group: "Pages" });
  }

  for (const sheet of methodologySheets) {
    items.push({
      label: sheet.title,
      description: sheet.objective,
      href: `/commercial/fiches/${sheet.slug}`,
      group: "Fiches méthodologiques",
    });
  }

  for (const competency of QCM_COMPETENCIES) {
    items.push({
      label: competency.label,
      description: "Entraînement QCM",
      href: qcmRoutes.trainingFor(competency.id),
      group: "QCM",
    });
  }

  for (const session of DEMO_COMMERCIAL_DASHBOARD.recentSessions) {
    items.push({
      label: session.title,
      description: "Votre historique de simulations",
      href: "/commercial/simulations",
      group: "Mes simulations",
    });
  }

  return items;
}

/** Filtre un index par une requête libre, sur le libellé et la description. */
export function filterSearchIndex(items: SearchItem[], query: string): SearchItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return items
    .filter((item) => `${item.label} ${item.description ?? ""}`.toLowerCase().includes(needle))
    .slice(0, 8);
}
