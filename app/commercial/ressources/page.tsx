import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Video } from "lucide-react";
import { COMPETENCIES } from "@/src/data/competencies";
import { methodologySheets } from "@/src/data/methodology/sheets";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { ALL_TRAINING_QUESTIONS } from "@/src/data/qcm/training-questions";
import { qcmRoutes } from "@/src/data/qcm/routes";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { DemoBadge } from "@/src/components/StatusBadge";

export const metadata: Metadata = {
  title: "Ressources",
  description: "Repères méthodologiques pour préparer les simulations.",
};

export default function RessourcesPage() {
  const questionCount =
    ALL_TRAINING_QUESTIONS.length + ASSESSMENTS.reduce((sum, a) => sum + a.questions.length, 0);

  const shortcuts = [
    {
      href: "/commercial/fiches",
      icon: BookOpen,
      label: "Référence",
      title: "Fiches méthodologiques",
      description:
        "Une fiche par compétence : enjeu, méthode en quatre étapes, formulations, cas terrain et checklist.",
      hint: `${methodologySheets.length} fiches`,
    },
    {
      href: qcmRoutes.home,
      icon: GraduationCap,
      label: "Entraînement écrit",
      title: "Entraînement QCM",
      description:
        "Entraînements ciblés avec correction immédiate et cinq évaluations transversales progressives.",
      hint: `${questionCount} questions`,
    },
    {
      href: "/commercial/nouvelle-simulation",
      icon: Video,
      label: "Mise en situation",
      title: "Simulation avec le client virtuel",
      description:
        "L’entretien complet face à l’avatar, analysé ensuite par le Coach IA sur les mêmes huit compétences.",
      hint: "Coach IA",
    },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Ressources"
        description="Tout ce qui prépare et prolonge une simulation : la méthode écrite, l’entraînement par questions, et l’entretien lui-même."
      />

      <ul className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <li key={shortcut.href} className="flex">
              <Link
                href={shortcut.href}
                className="nm-card-link group flex w-full flex-col p-5 sm:p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="nm-label mt-4">{shortcut.label}</span>
                <span className="mt-1.5 text-base font-semibold tracking-tight text-ink group-hover:text-brand">
                  {shortcut.title}
                </span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-graphite">
                  {shortcut.description}
                </span>
                <span className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-[13px] text-muted">{shortcut.hint}</span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                    Ouvrir
                    <ArrowRight
                      size={14}
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Panel
        className="mt-5"
        title="Les huit compétences évaluées"
        description="Chaque simulation est notée sur ces huit dimensions, de 0 à 100. Les fiches suivent le même référentiel."
        action={<DemoBadge>Contenus à valider par l’équipe formation</DemoBadge>}
      >
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {COMPETENCIES.map((competency, index) => (
            <li key={competency.id} className="rounded-md bg-mist/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-brand text-xs font-semibold tabular-nums text-white">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-ink">{competency.label}</span>
                </div>
                <Link
                  href={`/commercial/fiches/${competency.id}`}
                  className="shrink-0 text-[13px] font-medium text-brand underline underline-offset-4 hover:text-brand-accent"
                >
                  Fiche
                </Link>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-graphite">
                {competency.description}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
