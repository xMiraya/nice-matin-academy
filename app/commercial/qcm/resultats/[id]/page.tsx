import type { Metadata } from "next";
import { ResultView } from "@/src/components/qcm/ResultView";

export const metadata: Metadata = {
  title: "Résultat et correction",
  description: "Score par compétence, recommandations et correction commentée question par question.",
};

/**
 * Les résultats sont stockés localement sur le poste de l'utilisateur : la page
 * est donc rendue côté client à partir de l'identifiant présent dans l'URL.
 */
export default async function ResultPage({
  params,
}: PageProps<"/commercial/qcm/resultats/[id]">) {
  const { id } = await params;
  return <ResultView resultId={id} />;
}
