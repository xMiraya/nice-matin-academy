'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY_PROGRESS, createLocalProgressStore } from '@/src/lib/qcm/progression';
import type { ProgressStore, UserProgress } from '@/src/types/qcm/progress';

/**
 * Charge la progression depuis le stockage local apres l'hydratation, afin
 * d'eviter tout ecart entre le rendu serveur et le rendu client.
 */
export function useProgress() {
  const storeRef = useRef<ProgressStore | null>(null);
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);

  // Le store n'est jamais construit pendant le rendu : `ready` reste faux tant
  // que l'effet n'a pas eu lieu, et aucune ecriture n'est possible avant.
  useEffect(() => {
    storeRef.current ??= createLocalProgressStore();
    setProgress(storeRef.current.load());
    setReady(true);
  }, []);

  const update = useCallback((updater: (current: UserProgress) => UserProgress) => {
    setProgress((current) => {
      const next = updater(current);
      storeRef.current?.save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    storeRef.current?.clear();
    setProgress(EMPTY_PROGRESS);
  }, []);

  return useMemo(() => ({ progress, ready, update, reset }), [progress, ready, update, reset]);
}
