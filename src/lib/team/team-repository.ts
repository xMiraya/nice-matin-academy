import type { UserProfile } from "@/src/types";
import { createRemoteStore, sendJson } from "@/src/lib/remote-store";

/** Commerciaux de l'équipe, lus depuis la base (réservé au manager). */
export interface TeamAccount {
  profile: UserProfile;
  email: string;
  active: boolean;
}

const EMPTY: TeamAccount[] = [];

const store = createRemoteStore<TeamAccount[]>({
  url: "/api/team",
  empty: EMPTY,
  select: (json) => (json as { members?: TeamAccount[] }).members ?? EMPTY,
});

export const getTeamSnapshot = store.getSnapshot;
export const getServerTeamSnapshot = store.getServerSnapshot;
export const subscribeToTeam = store.subscribe;
export const getTeamLoaded = store.getLoaded;
export const getServerTeamLoaded = store.getServerLoaded;

export interface NewCommercial {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  jobTitle: string;
  team: string;
  level: "debutant" | "intermediaire" | "confirme" | null;
}

export async function createCommercial(input: NewCommercial): Promise<void> {
  await sendJson("/api/team", "POST", input);
  await store.refresh();
}

export async function updateCommercial(
  id: string,
  patch: {
    active?: boolean;
    password?: string;
    jobTitle?: string;
    team?: string;
    level?: NewCommercial["level"];
  },
): Promise<void> {
  await sendJson(`/api/team/${encodeURIComponent(id)}`, "PATCH", patch);
  await store.refresh();
}
