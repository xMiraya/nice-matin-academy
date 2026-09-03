import { z } from "zod";

/**
 * Commentaires du manager sur un compte rendu de simulation.
 *
 * Même avertissement que les autres couches de stockage local du prototype :
 * ce mécanisme démontre le circuit complet (commentaire → notification →
 * lecture par le commercial) sur un seul appareil. Il n'a pas vocation à
 * remplacer un vrai stockage partagé avant la mise en production.
 */

export interface ReportComment {
  id: string;
  reportId: string;
  authorName: string;
  authorRole: "manager" | "commercial";
  text: string;
  createdAt: string;
}

const CommentSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  authorName: z.string(),
  authorRole: z.enum(["manager", "commercial"]),
  text: z.string(),
  createdAt: z.string(),
});

const STORAGE_KEY = "niceMatinReportComments";
const CHANGE_EVENT = "nicematin:comments-changed";
const EMPTY: ReportComment[] = [];

let cachedRaw: string | null = null;
let cachedComments: ReportComment[] = EMPTY;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parse(raw: string | null): ReportComment[] {
  if (!raw) return EMPTY;
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(parsedJson)) return EMPTY;
  const comments: ReportComment[] = [];
  for (const item of parsedJson) {
    const result = CommentSchema.safeParse(item);
    if (result.success) comments.push(result.data);
  }
  return comments.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

function notifyChange(): void {
  cachedRaw = null;
  for (const listener of listeners) listener();
}

export function getCommentsSnapshot(): ReportComment[] {
  if (!isBrowser()) return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedComments = parse(raw);
  }
  return cachedComments;
}

export function getServerCommentsSnapshot(): ReportComment[] {
  return EMPTY;
}

export function subscribeToComments(listener: () => void): () => void {
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

/** Ajoute un commentaire à un compte rendu. */
export function addComment(input: Omit<ReportComment, "id" | "createdAt">): ReportComment {
  const comment: ReportComment = {
    ...input,
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    const next = [...getCommentsSnapshot(), comment];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notifyChange();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return comment;
}
