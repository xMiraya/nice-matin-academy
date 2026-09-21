import type { TeamMember, SessionSummary } from "@/src/types";
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
export function managerSearchIndex(
  members: TeamMember[] = [],
  sessions: SessionSummary[] = [],
): SearchItem[] {
  const items: SearchItem[] = [];

  for (const item of NAVIGATION.manager) {
    items.push({ label: item.label, href: item.href, group: "Pages" });
  }

  for (const member of members) {
    const name = `${member.profile.firstName} ${member.profile.lastName}`;
    items.push({
      label: name,
      description:
        member.sessionsCount > 0
          ? `${member.profile.team}, ${member.averageScore} / 100 en moyenne`
          : `${member.profile.team}, aucune simulation`,
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

  for (const session of sessions.slice(0, 30)) {
    items.push({
      label: session.title,
      description: session.repName ? `Simulation de ${session.repName}` : "Simulation",
      href: session.href ?? "/manager/simulations",
      group: "Simulations",
    });
  }

  return items;
}

/** Index de recherche de l'espace commercial. */
export function commercialSearchIndex(sessions: SessionSummary[] = []): SearchItem[] {
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

  for (const session of sessions.slice(0, 30)) {
    items.push({
      label: session.title,
      description: "Votre historique de simulations",
      href: session.href ?? "/commercial/simulations",
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
