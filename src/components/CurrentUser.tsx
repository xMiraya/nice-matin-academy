"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { UserProfile } from "@/src/types";

const CurrentUserContext = createContext<UserProfile | null>(null);

/** Fournit le profil de l'utilisateur connecté aux composants clients. */
export function CurrentUserProvider({ profile, children }: { profile: UserProfile; children: ReactNode }) {
  return <CurrentUserContext.Provider value={profile}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): UserProfile {
  const profile = useContext(CurrentUserContext);
  if (!profile) throw new Error("useCurrentUser doit être utilisé sous CurrentUserProvider.");
  return profile;
}
