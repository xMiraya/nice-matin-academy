import type { Metadata } from "next";
import { BookOpen, ClipboardList, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { ButtonLink } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { LevelLadder } from "@/src/components/qcm/LevelLadder";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { ALL_TRAINING_QUESTIONS } from "@/src/data/qcm/training-questions";
import { qcmRoutes } from "@/src/data/qcm/routes";

export const metadata: Metadata = {
  title: "Entraînement QCM",
  description:
    "Entraînements ciblés par compétence et cinq évaluations transversales, avec correction commentée.",
};

const ENTRY_POINTS = [
  {
    href: qcmRoutes.training,
    icon: Target,
    label: "Entraînement ciblé",
    title: "Travailler une compétence",
    description:
      "Une série de questions tirées au hasard sur la compétence de votre choix, avec correction immédiate après chaque réponse.",
  },
  {
    href: qcmRoutes.assessments,
    icon: ClipboardList,
    label: "Évaluation",
    title: "Passer un niveau",
    description:
      "Cinq évaluations transversales mélangent les huit compétences. La correction détaillée arrive après l’envoi complet.",
  },
  {
    href: qcmRoutes.progress,
    icon: TrendingUp,
    label: "Suivi",
    title: "Voir ma progression",
    description:
      "Moyenne par compétence, historique des passages et recommandations, enregistrés dans ce navigateur.",
  },
] as const;

export default function QcmHomePage() {
  const assessmentQuestions = ASSESSMENTS.reduce((sum, a) => sum + a.questions.length, 0);
  const total = assessmentQuestions + ALL_TRAINING_QUESTIONS.length;

  return (
    <>
      <PageHeader
        eyebrow="Espace commercial"
        title="Entraînement QCM"
        description="La partie écrite de l’académie : on y vérifie la méthode question par question, avant de la jouer en simulation face au client virtuel."
        actions={
          <>
            <ButtonLink href={qcmRoutes.training}>Commencer un entraînement</ButtonLink>
            <ButtonLink href={qcmRoutes.assessments} variant="secondary">
              Passer une évaluation
            </ButtonLink>
          </>
        }
        meta={
          <>
            <Badge tone="marque">{total} questions</Badge>
            <Badge tone="neutre">8 compétences · 5 niveaux</Badge>
            <Badge tone="vigilance">Contenus à valider par l’équipe formation</Badge>
          </>
        }
      />

      <ul className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {ENTRY_POINTS.map((entry) => {
          const Icon = entry.icon;
          return (
            <li key={entry.href} className="flex">
              <a
                href={entry.href}
                className="nm-card group flex w-full flex-col p-5 transition-shadow hover:shadow-lift sm:p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-soft text-brand">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="nm-label mt-4">{entry.label}</span>
                <span className="mt-1.5 text-base font-semibold tracking-tight text-ink group-hover:text-brand">
                  {entry.title}
                </span>
                <span className="mt-2 text-sm leading-relaxed text-graphite">
                  {entry.description}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <Panel
        className="mt-5"
        title="Les cinq niveaux"
        description="Les questions ne sont pas regroupées par thème : à vous d’identifier la compétence à mobiliser."
      >
        <LevelLadder />
      </Panel>

      <Panel
        className="mt-5"
        title="Où se situe le QCM dans le parcours"
        action={
          <ButtonLink href="/commercial/fiches" variant="ghost" size="sm">
            <BookOpen size={15} aria-hidden />
            Voir les fiches
          </ButtonLink>
        }
      >
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              step: 1,
              title: "Lire la fiche",
              text: "La fiche méthodologique donne la méthode en quatre étapes et les formulations attendues.",
            },
            {
              step: 2,
              title: "Vérifier par le QCM",
              text: "L’entraînement ciblé contrôle la compréhension, l’évaluation mesure la mise en application.",
            },
            {
              step: 3,
              title: "Jouer la simulation",
              text: "Le Coach IA note l’entretien réel sur les mêmes huit compétences.",
            },
          ].map((item) => (
            <li key={item.step} className="rounded-sm bg-mist/70 p-4">
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-xs bg-brand text-xs font-semibold tabular-nums text-white"
              >
                {item.step}
              </span>
              <p className="mt-2.5 text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-graphite">{item.text}</p>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}
