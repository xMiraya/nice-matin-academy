import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/src/components/PageHeader";
import { Badge } from "@/src/components/StatusBadge";
import { CompetencyBriefing } from "@/src/components/qcm/CompetencyBriefing";
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
        back={{ href: qcmRoutes.training, label: "Compétences" }}
        meta={
          <>
            <Badge tone="marque">{pool.length} questions disponibles</Badge>
            <Badge tone="vigilance">Contenu à valider par l’équipe formation</Badge>
          </>
        }
      />

      {/*
        L'entraînement passe avant la théorie : le commercial vient s'exercer,
        le rappel de la compétence reste replié juste en dessous.
      */}
      <TrainingSession competency={competency} pool={pool} />

      <div className="mt-6">
        <CompetencyBriefing competency={competency} />
      </div>
    </>
  );
}
