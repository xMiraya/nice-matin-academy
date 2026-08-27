import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Printer } from "lucide-react";
import { methodologySheets } from "@/src/data/methodology/sheets";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { VALIDATION_LABEL } from "@/src/types/methodology";

export const metadata: Metadata = {
  title: "Fiches méthodologiques",
  description:
    "Les huit fiches méthodologiques du Groupe Nice-Matin : enjeu, méthode en quatre étapes, formulations, situation terrain et checklist.",
};

export default function FichesPage() {
  const toValidate = methodologySheets.filter(
    (sheet) => sheet.validationStatus === "a-valider",
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Fiches méthodologiques"
        description="Une fiche par compétence évaluée : ce qui est en jeu, la méthode en quatre étapes, les formulations à utiliser et à éviter, un cas terrain et une checklist à cocher avant de poursuivre."
        actions={
          <ButtonLink href="/commercial/qcm" variant="secondary">
            S’entraîner sur ces compétences
          </ButtonLink>
        }
        meta={
          toValidate > 0 ? (
            <Badge tone="vigilance">
              {toValidate} fiche{toValidate > 1 ? "s" : ""} sur {methodologySheets.length} —{" "}
              {VALIDATION_LABEL}
            </Badge>
          ) : null
        }
      />

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {methodologySheets.map((sheet) => (
          <li key={sheet.slug} className="flex">
            <Link
              href={`/commercial/fiches/${sheet.slug}`}
              className="nm-card group flex w-full flex-col p-5 transition-shadow hover:shadow-lift sm:p-6"
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold tabular-nums text-white"
                >
                  {sheet.number}
                </span>
                <span className="nm-label">Compétence {sheet.number}</span>
              </div>

              <h2 className="mt-3.5 text-base font-semibold tracking-tight text-ink group-hover:text-brand">
                {sheet.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite">{sheet.definition}</p>

              <p className="mt-4 rounded-sm border border-line bg-mist/60 p-3.5 text-sm leading-relaxed text-graphite">
                <span className="nm-label mb-1.5 block">Objectif</span>
                {sheet.objective}
              </p>

              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                  <Clock3 size={14} aria-hidden />
                  {sheet.readingMinutes} min
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                  Ouvrir la fiche
                  <ArrowRight
                    size={14}
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Panel
        className="mt-5"
        title="Utiliser les fiches"
        description="Elles servent de référence commune entre les simulations et les entraînements."
      >
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <li className="rounded-sm bg-mist/70 p-4">
            <p className="nm-label">Avant une simulation</p>
            <p className="mt-2 text-sm leading-relaxed text-graphite">
              Relire la fiche de la compétence visée et sa checklist : cinq minutes suffisent.
            </p>
          </li>
          <li className="rounded-sm bg-mist/70 p-4">
            <p className="nm-label">Après l’analyse du Coach IA</p>
            <p className="mt-2 text-sm leading-relaxed text-graphite">
              Reprendre la fiche des deux compétences les plus basses, puis refaire un entretien.
            </p>
          </li>
          <li className="rounded-sm bg-mist/70 p-4">
            <p className="nm-label flex items-center gap-1.5">
              <Printer size={12} aria-hidden />
              Sur le terrain
            </p>
            <p className="mt-2 text-sm leading-relaxed text-graphite">
              Chaque fiche s’imprime en A4 paysage depuis le bouton « Imprimer la fiche ».
            </p>
          </li>
        </ul>
      </Panel>
    </>
  );
}
