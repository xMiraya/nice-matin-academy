import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/src/components/PageHeader";
import { AssessmentRunner } from "@/src/components/qcm/AssessmentRunner";
import { ASSESSMENTS, findAssessmentByLevel } from "@/src/data/qcm/assessments";
import { qcmRoutes } from "@/src/data/qcm/routes";

export function generateStaticParams() {
  return ASSESSMENTS.map((a) => ({ niveau: String(a.level) }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/commercial/qcm/evaluations/[niveau]">): Promise<Metadata> {
  const { niveau } = await params;
  const assessment = findAssessmentByLevel(niveau);
  return { title: assessment ? assessment.title : "Évaluation introuvable" };
}

export default async function AssessmentPage({
  params,
}: PageProps<"/commercial/qcm/evaluations/[niveau]">) {
  const { niveau } = await params;
  const assessment = findAssessmentByLevel(niveau);
  if (!assessment) notFound();

  return (
    <>
      <PageHeader
        eyebrow={`${assessment.kicker} · niveau ${assessment.level}`}
        title={assessment.title}
        back={{ href: qcmRoutes.assessments, label: "Les cinq évaluations" }}
      />
      <AssessmentRunner assessment={assessment} />
    </>
  );
}
