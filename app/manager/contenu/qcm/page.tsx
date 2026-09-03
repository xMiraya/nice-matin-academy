import type { Metadata } from "next";
import { allQuestionsIndexed } from "@/src/data/qcm/all-questions";
import { COMPETENCIES } from "@/src/data/qcm/competencies";
import { PageHeader } from "@/src/components/PageHeader";
import { ContentQuestionList } from "@/app/manager/contenu/qcm/ContentQuestionList";

export const metadata: Metadata = {
  title: "Questions de QCM",
  description: "Modifier le contenu des questions de QCM.",
};

export default function ManagerContentQcmPage() {
  const items = allQuestionsIndexed();

  return (
    <>
      <PageHeader
        eyebrow="Contenu pédagogique"
        title="Questions de QCM"
        description="Recherchez une question, filtrez par compétence. Les questions de réordonnancement restent en lecture seule dans cette version."
        back={{ href: "/manager/contenu", label: "Contenu pédagogique" }}
      />
      <ContentQuestionList items={items} competencies={COMPETENCIES} />
    </>
  );
}
