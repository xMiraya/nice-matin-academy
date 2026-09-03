import { z } from "zod";

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
 * ⚠️ Même avertissement que le reste du stockage local du prototype : ceci
 * vit uniquement dans le navigateur courant. Un déploiement réel a besoin
 * d'un stockage serveur partagé entre le poste du manager et celui des
 * commerciaux.
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

const SheetPatchSchema = z.object({
  objective: z.string().optional(),
  stakes: z.array(z.string()).optional(),
  goodReflexes: z.array(z.string()).optional(),
  phrasesToUse: z.array(z.string()).optional(),
  phrasesToAvoid: z.array(z.string()).optional(),
  usefulQuestions: z.array(z.string()).optional(),
  checklist: z.array(z.string()).optional(),
  trainerTip: z.string().optional(),
});

const QuestionPatchSchema = z.object({
  prompt: z.string().optional(),
  explanation: z.string().optional(),
  fieldTip: z.string().optional(),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        correct: z.boolean(),
        rationale: z.string(),
      }),
    )
    .optional(),
});

const OverrideSchema = z.object({
  key: z.string(),
  kind: z.enum(["sheet", "question"]),
  targetId: z.string(),
  status: z.enum(["draft", "published"]),
  patch: z.union([SheetPatchSchema, QuestionPatchSchema]),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

const STORAGE_KEY = "niceMatinContentOverrides";
const CHANGE_EVENT = "nicematin:content-overrides-changed";
const EMPTY: ContentOverride[] = [];

let cachedRaw: string | null = null;
let cachedOverrides: ContentOverride[] = EMPTY;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function keyOf(kind: ContentKind, targetId: string): string {
  return `${kind}:${targetId}`;
}

function parse(raw: string | null): ContentOverride[] {
  if (!raw) return EMPTY;
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(parsedJson)) return EMPTY;
  const overrides: ContentOverride[] = [];
  for (const item of parsedJson) {
    const result = OverrideSchema.safeParse(item);
    if (result.success) overrides.push(result.data as ContentOverride);
  }
  return overrides;
}

function notifyChange(): void {
  cachedRaw = null;
  for (const listener of listeners) listener();
}

export function getOverridesSnapshot(): ContentOverride[] {
  if (!isBrowser()) return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedOverrides = parse(raw);
  }
  return cachedOverrides;
}

export function getServerOverridesSnapshot(): ContentOverride[] {
  return EMPTY;
}

export function subscribeToOverrides(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) notifyChange();
  };
  const onLocalChange = () => listener();
  if (isBrowser()) {
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onLocalChange);
  }
  return () => {
    listeners.delete(listener);
    if (isBrowser()) {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onLocalChange);
    }
  };
}

function persist(next: ContentOverride[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  notifyChange();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getOverride(kind: ContentKind, targetId: string): ContentOverride | null {
  return getOverridesSnapshot().find((item) => item.key === keyOf(kind, targetId)) ?? null;
}

/** Seul un écart publié doit influencer ce que voit un commercial. */
export function getPublishedOverride(kind: ContentKind, targetId: string): ContentOverride | null {
  const found = getOverride(kind, targetId);
  return found && found.status === "published" ? found : null;
}

/** Enregistre un brouillon, sans le rendre visible côté commercial. */
export function saveDraft(
  kind: ContentKind,
  targetId: string,
  patch: SheetPatch | QuestionPatch,
  updatedBy: string,
): void {
  const key = keyOf(kind, targetId);
  const next = getOverridesSnapshot().filter((item) => item.key !== key);
  next.push({
    key,
    kind,
    targetId,
    status: "draft",
    patch,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
  persist(next);
}

/** Publie le contenu : c'est ce que les commerciaux verront désormais. */
export function publish(
  kind: ContentKind,
  targetId: string,
  patch: SheetPatch | QuestionPatch,
  updatedBy: string,
): void {
  const key = keyOf(kind, targetId);
  const next = getOverridesSnapshot().filter((item) => item.key !== key);
  next.push({
    key,
    kind,
    targetId,
    status: "published",
    patch,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
  persist(next);
}

/** Supprime l'écart : revient au contenu d'origine, brouillon compris. */
export function revertToOriginal(kind: ContentKind, targetId: string): void {
  const key = keyOf(kind, targetId);
  persist(getOverridesSnapshot().filter((item) => item.key !== key));
}
