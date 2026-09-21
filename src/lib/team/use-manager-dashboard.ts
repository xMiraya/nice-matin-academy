"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ManagerDashboard } from "@/src/types";
import { useCurrentUser } from "@/src/components/CurrentUser";
import { useIsHydrated, useReports } from "@/src/lib/reports/use-reports";
import {
  getServerTeamLoaded,
  getServerTeamSnapshot,
  getTeamLoaded,
  getTeamSnapshot,
  subscribeToTeam,
} from "@/src/lib/team/team-repository";
import type { TeamAccount } from "@/src/lib/team/team-repository";
import { buildManagerDashboard } from "@/src/lib/team/team-insights";

export function useTeamAccounts(): TeamAccount[] {
  return useSyncExternalStore(subscribeToTeam, getTeamSnapshot, getServerTeamSnapshot);
}

function useTeamLoaded(): boolean {
  return useSyncExternalStore(subscribeToTeam, getTeamLoaded, getServerTeamLoaded);
}

/**
 * Tableau de bord d'équipe calculé à partir des comptes et des comptes rendus
 * réels. `dashboard` vaut `null` tant que la première lecture n'est pas finie.
 */
export function useManagerDashboard(): { dashboard: ManagerDashboard | null; loading: boolean } {
  const profile = useCurrentUser();
  const accounts = useTeamAccounts();
  const reports = useReports();
  const teamLoaded = useTeamLoaded();
  const reportsLoaded = useIsHydrated();
  const ready = teamLoaded && reportsLoaded;

  const dashboard = useMemo(
    () =>
      ready
        ? buildManagerDashboard(
            profile,
            accounts.filter((account) => account.active).map((account) => account.profile),
            reports,
          )
        : null,
    [ready, profile, accounts, reports],
  );
  return { dashboard, loading: !ready };
}
