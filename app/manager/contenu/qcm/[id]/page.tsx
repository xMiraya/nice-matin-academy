import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allQuestionsIndexed } from "@/src/data/qcm/all-questions";
import { QuestionEditorScreen } from "@/app/manager/contenu/qcm/[id]/QuestionEditorScreen";

export function generateStaticParams(): { id: string }[] {
  return allQuestionsIndexed()
    .filter((item) => item.question.kind !== "ordering")
    .map((item) => ({ id: item.question.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<"/manager/contenu/qcm/[id]">): Promise<Metadata> {
  const { id } = await params;
  const found = allQuestionsIndexed().find((item) => item.question.id === id);
  return { title: found ? "Modifier une question" : "Question introuvable" };
}

export default async function ManagerQuestionEditorPage({
  params,
}: PageProps<"/manager/contenu/qcm/[id]">) {
  const { id } = await params;
  const found = allQuestionsIndexed().find((item) => item.question.id === id);
  if (!found || found.question.kind === "ordering") notFound();
  return <QuestionEditorScreen question={found.question} />;
}
