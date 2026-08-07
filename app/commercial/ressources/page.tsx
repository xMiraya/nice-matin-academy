import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { COMPETENCIES } from "@/src/data/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { EmptyState } from "@/src/components/EmptyState";
import { DemoBadge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";

export const metadata: Metadata = {
  title: "Ressources",
  description: "Repères méthodologiques pour préparer les simulations.",
};

export default function RessourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Ressources"
        description="Les repères utilisés par le Coach IA pour évaluer chaque entretien."
        actions={<DemoBadge>Contenus complets bientôt disponibles</DemoBadge>}
      />

      <Panel
        title="Les huit compétences évaluées"
        description="Chaque simulation est notée sur ces huit dimensions, de 0 à 100."
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COMPETENCIES.map((competency, index) => (
            <li key={competency.id} className="rounded-md border border-line p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-ink text-xs font-semibold tabular-nums text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-ink">{competency.label}</span>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-graphite">
                {competency.description}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-6">
        <EmptyState
          icon={<BookOpen size={20} aria-hidden />}
          title="Fiches méthodologiques en préparation"
          description="Les guides détaillés, les exemples d'appels commentés et les fiches produit seront ajoutés à cette rubrique."
          action={
            <ButtonLink href="/commercial/nouvelle-simulation" variant="secondary">
              En attendant, lancer une simulation
            </ButtonLink>
          }
        />
      </div>
    </>
  );
}
