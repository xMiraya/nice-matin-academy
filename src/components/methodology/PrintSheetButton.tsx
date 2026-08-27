"use client";

import { Printer } from "lucide-react";
import { Button } from "@/src/components/Button";

/** Impression navigateur de la fiche courante : aucun PDF généré côté serveur. */
export function PrintSheetButton() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()} data-print="hide">
      <Printer size={15} aria-hidden />
      Imprimer la fiche
    </Button>
  );
}
