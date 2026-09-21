"use client";

import { LogOut } from "lucide-react";
import { cx } from "@/src/lib/format";

/** Ferme la session côté serveur, puis retourne à l'écran de connexion. */
export function LogoutButton({ className }: { className?: string }) {
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Navigation complète : repart d'un état client vierge (magasins de données vidés).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/connexion";
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      aria-label="Se déconnecter"
      title="Se déconnecter"
      className={cx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-white hover:text-brand",
        className,
      )}
    >
      <LogOut size={15} aria-hidden />
    </button>
  );
}
