import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { COMPETENCIES } from "@/src/data/qcm/competencies";
import { trainingQuestionsFor } from "@/src/data/qcm/training-questions";
import { qcmRoutes } from "@/src/data/qcm/routes";
import { TRAINING_SAMPLE_SIZE } from "@/src/data/qcm/config";

export const metadata: Metadata = {
  title: "Entraînement par compétence",
  description: "Choisir une compétence et lancer une série de questions tirées au hasard.",
};

/**
 * Première phrase du résumé pédagogique.
 *
 * Les cartes de choix n'ont pas à porter tout le résumé : la compétence est
 * détaillée sur sa propre page. Une ligne suffit pour choisir.
 */
function firstSentence(text: string, max = 110): string {
  const end = text.indexOf(". ");
  const sentence = end === -1 ? text : `${text.slice(0, end)}.`;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export default function TrainingIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Entraînement QCM"
        title="Choisir une compétence"
        description={`Chaque série tire ${TRAINING_SAMPLE_SIZE} questions au hasard, avec la correction juste après chaque réponse. Rien n'est noté, vous pouvez recommencer autant de fois que vous voulez.`}
        back={{ href: qcmRoutes.home, label: "Entraînement QCM" }}
      />

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COMPETENCIES.map((competency) => (
          <li key={competency.id} className="flex">
            <Link
              href={qcmRoutes.trainingFor(competency.id)}
              className="nm-card-link group relative flex w-full flex-col overflow-hidden p-5"
            >
              {/* Le chiffre porte la hiérarchie visuelle à la place du texte. */}
              <span
                aria-hidden
                className="nm-display absolute -right-1 top-1 select-none text-[5rem] leading-none text-line/70 transition-colors group-hover:text-brand-sky"
              >
                {competency.order}
              </span>

              <span className="nm-label relative">{competency.kicker}</span>
              <span className="relative mt-2 text-[17px] font-semibold leading-snug tracking-tight text-ink group-hover:text-brand">
                {competency.label}
              </span>
              <span className="relative mt-2 flex-1 text-sm leading-relaxed text-graphite">
                {firstSentence(competency.summary)}
              </span>

              <span className="relative mt-5 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-graphite">
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
