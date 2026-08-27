import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { TrainingSession } from "@/src/components/qcm/TrainingSession";
import { COMPETENCIES, findCompetency } from "@/src/data/qcm/competencies";
import { trainingQuestionsFor } from "@/src/data/qcm/training-questions";
import { qcmRoutes } from "@/src/data/qcm/routes";

export function generateStaticParams() {
  return COMPETENCIES.map((c) => ({ competence: c.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/commercial/qcm/entrainement/[competence]">): Promise<Metadata> {
  const { competence } = await params;
  const competency = findCompetency(competence);
  return { title: competency ? competency.label : "Compétence introuvable" };
}

export default async function TrainingCompetencyPage({
  params,
}: PageProps<"/commercial/qcm/entrainement/[competence]">) {
  const { competence } = await params;
  const competency = findCompetency(competence);
  if (!competency) notFound();

  const pool = trainingQuestionsFor(competency.id);

  return (
    <>
      <PageHeader
        eyebrow={competency.kicker}
        title={competency.label}
        description={competency.summary}
        back={{ href: qcmRoutes.training, label: "Compétences" }}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ListCard title="Objectifs" items={competency.objectives} tone="brand" />
        <ListCard title="Comportements attendus" items={competency.expectedBehaviours} tone="positif" />
        <ListCard title="Erreurs fréquentes" items={competency.commonMistakes} tone="critique" />
      </div>

      <p className="mt-5 text-xs text-muted">Source : {competency.source}</p>

      <div className="mt-6">
        <TrainingSession competency={competency} pool={pool} />
      </div>
    </>
  );
}

const DOTS = {
  brand: "bg-brand",
  positif: "bg-positive-bright",
  critique: "bg-danger-bright",
} as const;

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone: keyof typeof DOTS;
}) {
  return (
    <Panel title={title}>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-graphite">
            <span aria-hidden className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[tone]}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
