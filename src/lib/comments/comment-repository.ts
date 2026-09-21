import { createRemoteStore, sendJson } from "@/src/lib/remote-store";

/**
 * Commentaires sur un compte rendu de simulation, stockés en base.
 *
 * Le serveur crée lui-même la notification du destinataire : le commentaire et
 * l'alerte ne peuvent donc pas se désynchroniser.
 */

export interface ReportComment {
  id: string;
  reportId: string;
  authorName: string;
  authorRole: "manager" | "commercial";
  text: string;
  createdAt: string;
}

const EMPTY: ReportComment[] = [];

const store = createRemoteStore<ReportComment[]>({
  url: "/api/comments",
  empty: EMPTY,
  pollMs: 15_000,
  select: (json) => (json as { comments?: ReportComment[] }).comments ?? EMPTY,
});

export const getCommentsSnapshot = store.getSnapshot;
export const getServerCommentsSnapshot = store.getServerSnapshot;
export const subscribeToComments = store.subscribe;

/** Ajoute un commentaire ; l'auteur est celui de la session. */
export async function addComment(input: { reportId: string; text: string }): Promise<ReportComment> {
  const { comment } = await sendJson<{ comment: ReportComment }>("/api/comments", "POST", input);
  await store.refresh();
  return comment;
}
