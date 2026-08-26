"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@/src/types";
import { AppSidebar } from "@/src/components/AppSidebar";
import { MobileNavigation } from "@/src/components/MobileNavigation";
import { Topbar } from "@/src/components/Topbar";
import type { WorkspaceRole } from "@/src/components/navigation";

/** Routes affichées en plein écran, sans navigation autour. */
const IMMERSIVE_ROUTES = ["/commercial/appel"];

interface AppShellProps {
  role: WorkspaceRole;
  profile: UserProfile;
  children: ReactNode;
}

/** Ossature commune aux deux espaces : barre latérale, bandeau, navigation mobile. */
export function AppShell({ role, profile, children }: AppShellProps) {
  const pathname = usePathname();

  if (IMMERSIVE_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar role={role} profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} profile={profile} />
        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-14">
          <div className="mx-auto w-full max-w-[1340px]">{children}</div>
        </main>
        <MobileNavigation role={role} />
      </div>
    </div>
  );
}
