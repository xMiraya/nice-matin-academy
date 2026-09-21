'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EMPTY_PROGRESS } from '@/src/lib/qcm/progression';
import type { UserProgress } from '@/src/types/qcm/progress';

/**
 * File d'ecritures commune a toute la page : une lecture lancee juste apres une
 * navigation attend que l'ecriture precedente (envoyee au demontage) soit
 * terminee, sinon elle relirait une progression perimee.
 */
let writeChain: Promise<unknown> = Promise.resolve();

/**
 * Progression QCM de l'utilisateur connecté, stockee en base (`/api/progress`).
 *
 * `ready` reste faux tant que la premiere lecture n'est pas terminee, et aucune
 * ecriture n'a lieu avant : on n'ecrase donc jamais une progression existante
 * avec une progression vierge. Les ecritures sont regroupees et sequencees, de
 * sorte que la derniere version l'emporte.
 */
export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const latestRef = useRef<UserProgress>(EMPTY_PROGRESS);
  const timerRef = useRef<number | undefined>(undefined);

  const flush = useCallback(() => {
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    const body = JSON.stringify(latestRef.current);
    writeChain = writeChain.then(() =>
      fetch('/api/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    writeChain
      .then(() => fetch('/api/progress', { cache: 'no-store' }))
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { progress?: UserProgress } | null) => {
        if (cancelled) return;
        const loaded = json?.progress?.version === 1 ? json.progress : EMPTY_PROGRESS;
        latestRef.current = loaded;
        setProgress(loaded);
        readyRef.current = true;
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Serveur injoignable : on n'ecrit rien, pour ne rien ecraser.
        setReady(true);
      });
    const onHide = () => {
      if (timerRef.current !== undefined) flush();
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', onHide);
      if (timerRef.current !== undefined) flush();
    };
  }, [flush]);

  const update = useCallback(
    (updater: (current: UserProgress) => UserProgress) => {
      setProgress((current) => {
        const next = updater(current);
        latestRef.current = next;
        return next;
      });
      if (!readyRef.current) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(flush, 400);
    },
    [flush],
  );

  const reset = useCallback(() => {
    latestRef.current = EMPTY_PROGRESS;
    setProgress(EMPTY_PROGRESS);
    window.clearTimeout(timerRef.current);
    timerRef.current = undefined;
    writeChain = writeChain.then(() =>
      fetch('/api/progress', { method: 'DELETE' }).catch(() => undefined),
    );
  }, []);

  return useMemo(() => ({ progress, ready, update, reset }), [progress, ready, update, reset]);
}
