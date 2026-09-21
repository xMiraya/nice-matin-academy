import { createRemoteStore, sendJson } from "@/src/lib/remote-store";

/**
 * Surcouche de contenu pédagogique modifiable par le manager.
 *
 * Les fiches méthodologiques et les questions de QCM restent des données
 * statiques versionnées dans le dépôt (`src/data/methodology`,
 * `src/data/qcm`) : c'est le contenu de référence. Cette couche stocke
 * uniquement des *écarts* par rapport à cette référence, avec un statut
 * brouillon/publié — jamais le contenu entier recopié.
 *
 * Tant qu'un écart est en brouillon, seul le manager le voit, dans les écrans
 * d'édition. Une fois publié, il devient l'écart effectif retourné par
 * `getPublishedOverride`, que les écrans commerciaux appliquent par-dessus le
 * contenu statique.
 *
 * Persistance : les écarts sont stockés en base. Le manager publie, les
 * commerciaux voient la version publiée à leur prochain chargement (ou dans la
 * minute qui suit).
 */

export type ContentKind = "sheet" | "question";

export interface SheetPatch {
  objective?: string;
  stakes?: string[];
  goodReflexes?: string[];
  phrasesToUse?: string[];
  phrasesToAvoid?: string[];
  usefulQuestions?: string[];
  checklist?: string[];
  trainerTip?: string;
}

export interface QuestionOptionPatch {
  id: string;
  label: string;
  correct: boolean;
  rationale: string;
}

export interface QuestionPatch {
  prompt?: string;
  explanation?: string;
  fieldTip?: string;
  options?: QuestionOptionPatch[];
}

export interface ContentOverride {
  /** `sheet:<slug>` ou `question:<id>`. */
  key: string;
  kind: ContentKind;
  targetId: string;
  status: "draft" | "published";
  patch: SheetPatch | QuestionPatch;
  updatedAt: string;
  updatedBy: string;
}

const EMPTY: ContentOverride[] = [];

const store = createRemoteStore<ContentOverride[]>({
  url: "/api/content",
  empty: EMPTY,
  select: (json) => (json as { overrides?: ContentOverride[] }).overrides ?? EMPTY,
});

export const getOverridesSnapshot = store.getSnapshot;
export const getServerOverridesSnapshot = store.getServerSnapshot;
export const subscribeToOverrides = store.subscribe;
export const getOverridesLoaded = store.getLoaded;
export const getServerOverridesLoaded = store.getServerLoaded;

function keyOf(kind: ContentKind, targetId: string): string {
  return `${kind}:${targetId}`;
}

export function getOverride(kind: ContentKind, targetId: string): ContentOverride | null {
  return getOverridesSnapshot().find((item) => item.key === keyOf(kind, targetId)) ?? null;
}

/** Seul un écart publié doit influencer ce que voit un commercial. */
export function getPublishedOverride(kind: ContentKind, targetId: string): ContentOverride | null {
  const found = getOverride(kind, targetId);
  return found && found.status === "published" ? found : null;
}

async function write(
  status: "draft" | "published",
  kind: ContentKind,
  targetId: string,
  patch: SheetPatch | QuestionPatch,
): Promise<void> {
  await sendJson("/api/content", "PUT", { kind, targetId, status, patch });
  await store.refresh();
}

/** Enregistre un brouillon, sans le rendre visible côté commercial. */
export function saveDraft(
  kind: ContentKind,
  targetId: string,
  patch: SheetPatch | QuestionPatch,
): Promise<void> {
  return write("draft", kind, targetId, patch);
}

/** Publie le contenu : c'est ce que les commerciaux verront désormais. */
export function publish(
  kind: ContentKind,
  targetId: string,
  patch: SheetPatch | QuestionPatch,
): Promise<void> {
  return write("published", kind, targetId, patch);
}

/** Supprime l'écart : revient au contenu d'origine, brouillon compris. */
export async function revertToOriginal(kind: ContentKind, targetId: string): Promise<void> {
  await sendJson(
    `/api/content?kind=${encodeURIComponent(kind)}&targetId=${encodeURIComponent(targetId)}`,
    "DELETE",
  );
  await store.refresh();
}
