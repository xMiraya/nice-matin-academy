"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getCommentsSnapshot,
  getServerCommentsSnapshot,
  subscribeToComments,
} from "@/src/lib/comments/comment-repository";

/** Commentaires d'un compte rendu donné, du plus ancien au plus récent. */
export function useReportComments(reportId: string) {
  const all = useSyncExternalStore(
    subscribeToComments,
    getCommentsSnapshot,
    getServerCommentsSnapshot,
  );
  return useMemo(() => all.filter((comment) => comment.reportId === reportId), [all, reportId]);
}
