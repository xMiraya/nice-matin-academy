import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { COMPETENCIES } from "@/src/data/qcm/competencies";
import { trainingQuestionsFor } from "@/src/data/qcm/training-questions";
import { qcmRoutes } from "@/src/data/qcm/routes";

export const metadata: Metadata = {
  title: "Entraînement par compétence",
  description: "Choisir une compétence et lancer une série de questions tirées au hasard.",
};

export default function TrainingIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Entraînement QCM"
        title="Choisir une compétence"
        description="Chaque compétence propose une explication, les comportements attendus, les erreurs fréquentes et une série de questions tirées au hasard. La correction s’affiche après chaque réponse et vous pouvez recommencer autant de fois que vous le souhaitez."
        back={{ href: qcmRoutes.home, label: "Entraînement QCM" }}
      />

      <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {COMPETENCIES.map((competency) => (
          <li key={competency.id} className="flex">
            <Link
              href={qcmRoutes.trainingFor(competency.id)}
              className="nm-card group flex w-full flex-col p-5 transition-shadow hover:shadow-lift"
            >
              <span className="nm-label">{competency.kicker}</span>
              <span className="mt-2 text-base font-semibold tracking-tight text-ink group-hover:text-brand">
                {competency.label}
              </span>
              <span className="mt-2 flex-1 text-sm leading-relaxed text-graphite">
                {competency.summary}
              </span>
              <span className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="text-[13px] text-muted">
                  {trainingQuestionsFor(competency.id).length} questions
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                  Travailler
                  <ArrowRight
                    size={14}
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
