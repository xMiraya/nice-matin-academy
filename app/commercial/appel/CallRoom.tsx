"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button, ButtonLink } from "@/src/components/Button";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
import { Logo } from "@/src/components/Logo";
import { OBJECTIVES } from "@/src/data/competencies";
import { TavusVideoStage } from "@/app/commercial/appel/TavusVideoStage";
import type {
  TavusApiErrorResponse,
  TavusConversationClientResponse,
  TavusErrorCode,
} from "@/src/types/tavus";
import { cx, formatTimer } from "@/src/lib/format";
import {
  storeLastCallSession,
  storeLastConversationId,
  useSelectedObjectiveIds,
} from "@/src/lib/session-storage";

type CallStatus = "idle" | "starting" | "connecting" | "active" | "error";

/**
 * Salle d'appel connectée à Tavus. Aucune conversation n'est créée au
 * chargement de la page : elle démarre uniquement au clic du commercial, pour
 * ne jamais consommer de minutes après un simple rafraîchissement.
 */
export function CallRoom() {
  const router = useRouter();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [conversation, setConversation] = useState<TavusConversationClientResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<TavusErrorCode | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [endWarning, setEndWarning] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  // Julie réellement présente dans la salle, piste vidéo comprise. Distinct de
  // `status === "active"`, qui signifie seulement que le commercial a rejoint.
  const [isJulieReady, setIsJulieReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const objectiveIds = useSelectedObjectiveIds();

  // Empêche les doubles clics / créations multiples de conversation.
  const isStartingRef = useRef(false);
  const isEndingRef = useRef(false);
  // Évite les mises à jour d'état après la navigation vers /commercial/analyse.
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Remis à `true` à chaque montage : le Mode strict de React démonte puis
    // remonte les composants une fois en développement, sans quoi cette
    // référence resterait bloquée à `false` après le premier cycle.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Le chronomètre ne démarre qu'une fois Julie effectivement présente : ni la
  // création de la conversation, ni la connexion média ne sont du temps
  // d'entretien.
  useEffect(() => {
    if (status !== "active" || !isJulieReady) return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [status, isJulieReady]);

  /**
   * Tentative de clôture propre si l'utilisateur quitte la page avec un appel
   * encore actif.
   *
   * `sendBeacon` est volontairement choisi : la requête part en arrière-plan
   * sans jamais retarder ni bloquer la fermeture de l'onglet. Le navigateur ne
   * garantit pas son acheminement — c'est un filet, pas la voie principale,
   * qui reste le bouton « Terminer l'appel ».
   */
  useEffect(() => {
    if (!conversation) return;

    const conversationId = conversation.conversation_id;

    const closeQuietly = () => {
      if (isEndingRef.current) return;
      navigator.sendBeacon?.(`/api/tavus/conversations/${conversationId}/end`);
    };

    window.addEventListener("pagehide", closeQuietly);
    return () => window.removeEventListener("pagehide", closeQuietly);
  }, [status, conversation]);

  const objectiveLabel = useMemo(() => {
    if (objectiveIds.length === 0) return null;
    if (objectiveIds.length === OBJECTIVES.length) return "Entretien commercial complet";
    return OBJECTIVES.filter((objective) => objectiveIds.includes(objective.id))
      .map((objective) => objective.label)
      .join(" · ");
  }, [objectiveIds]);

  /**
   * État lisible de la mise en relation. Trois étapes seulement, pour que le
   * commercial sache toujours ce qu'il attend pendant la préparation Tavus.
   */
  const stageLabel = useMemo(() => {
    if (status === "starting") return "Préparation de Julie…";
    if (status === "connecting") return "Connexion audio et vidéo…";
    if (status === "active") return isJulieReady ? "Julie est prête" : "Préparation de Julie…";
    return null;
  }, [status, isJulieReady]);

  const startCall = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setStatus("starting");
    setErrorMessage(null);
    setErrorCode(null);
    setIsJulieReady(false);

    try {
      const response = await fetch("/api/tavus/conversations", { method: "POST" });
      const payload = (await response.json()) as
        | TavusConversationClientResponse
        | TavusApiErrorResponse;

      if (!isMountedRef.current) return;

      if (!response.ok || !("conversation_id" in payload)) {
        setErrorMessage(
          "error" in payload
            ? payload.error
            : "Impossible de démarrer l'appel avec Julie pour le moment.",
        );
        setErrorCode("error" in payload && payload.code ? payload.code : null);
        setStatus("error");
        return;
      }

      // Mémorisé dès la création : si l'appel se termine depuis l'iframe Tavus
      // ou si la page est rafraîchie, l'analyse reste rattachable à cet appel.
      storeLastConversationId(payload.conversation_id);

      setConversation(payload);
      setSeconds(0);
      // « connecting » et non « active » : le chronomètre attend l'événement
      // `joined-meeting` renvoyé par Daily.
      setStatus("connecting");
    } catch {
      if (isMountedRef.current) {
        setErrorMessage("Impossible de démarrer l'appel avec Julie pour le moment.");
        setErrorCode(null);
        setStatus("error");
      }
    } finally {
      isStartingRef.current = false;
    }
  }, []);

  /** Le commercial a rejoint la salle. Julie peut ne pas être encore arrivée. */
  const handleStageJoined = useCallback(() => {
    if (!isMountedRef.current) return;
    setStatus("active");
  }, []);

  /** Julie est présente et visible : c'est ici que l'entretien démarre vraiment. */
  const handleJulieReady = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsJulieReady(true);
    setSeconds(0);
  }, []);

  /** La salle s'est fermée d'elle-même (fin côté Tavus, durée maximale atteinte). */
  const handleStageLeft = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsJulieReady(false);
    setStatus((current) => (current === "error" ? current : "connecting"));
  }, []);

  const handleStageError = useCallback((message: string) => {
    if (!isMountedRef.current) return;
    setIsJulieReady(false);
    setConversation(null);
    setErrorMessage(message);
    setErrorCode(null);
    setStatus("error");
  }, []);

  const endCall = useCallback(async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;
    setIsEnding(true);

    const activeConversationId = conversation?.conversation_id;

    if (activeConversationId) {
      // La session est enregistrée AVANT l'appel réseau : même si Tavus répond
      // lentement ou échoue, l'analyse reste rattachable à cette conversation.
      storeLastConversationId(activeConversationId);
      storeLastCallSession({
        conversationId: activeConversationId,
        endedAt: new Date().toISOString(),
        durationSeconds: seconds,
        selectedObjectiveIds: objectiveIds,
      });

      let closeFailed = false;
      try {
        const response = await fetch(
          `/api/tavus/conversations/${activeConversationId}/end`,
          { method: "POST", signal: AbortSignal.timeout(10_000) },
        );
        closeFailed = !response.ok;
      } catch {
        closeFailed = true;
      }

      // Échec récupérable : l'entretien est conservé, l'analyse reste possible.
      // On laisse la main à l'utilisateur plutôt que de rediriger en silence.
      if (closeFailed && isMountedRef.current) {
        setEndWarning(
          "La clôture de l'appel côté Tavus n'a pas abouti. Votre entretien est bien enregistré : vous pouvez poursuivre vers l'analyse.",
        );
        setIsEnding(false);
        isEndingRef.current = false;
        return;
      }
    }

    setIsJulieReady(false);
    setConversation(null);
    setStatus("idle");
    router.push("/commercial/analyse");
  }, [conversation, objectiveIds, router, seconds]);

  return (
    <div className="flex min-h-screen flex-col bg-ink text-white">
      {/* Bandeau */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <Logo size="sm" tone="dark" />
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 rounded-sm bg-white/10 px-3 py-1.5">
            <span
              className={cx(
                "h-2 w-2 rounded-full bg-brand",
                status === "active" && isJulieReady && "animate-pulse",
              )}
              aria-hidden
            />
            <span className="text-xs font-semibold uppercase tracking-[0.1em]">
              {stageLabel ?? "Simulation"}
            </span>
          </span>
          <span
            className="font-mono text-sm font-semibold tabular-nums"
            aria-label={`Durée de l'appel : ${formatTimer(seconds)}`}
          >
            {formatTimer(seconds)}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-5 sm:px-6">
        {/* Rappel discret de l'objectif */}
        {objectiveLabel ? (
          <p className="mb-4 text-sm text-white/55">
            Objectif de la session : <span className="font-medium text-white/85">{objectiveLabel}</span>
          </p>
        ) : null}

        <div className="mx-auto w-full max-w-5xl">
          {conversation ? (
            <TavusVideoStage
              key={conversation.conversation_id}
              roomUrl={conversation.conversation_url}
              micOn={micOn}
              cameraOn={cameraOn}
              onJoined={handleStageJoined}
              onJulieReady={handleJulieReady}
              onLeft={handleStageLeft}
              onError={handleStageError}
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[#0f0f11]">
              <div className="flex flex-col items-center px-6 text-center">
                {status === "error" ? (
                  <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
                      <AlertTriangle size={26} aria-hidden />
                    </span>
                    {/* Un compte sans crédits ne se résout pas par un nouvel essai :
                        le problème est nommé explicitement, sans bouton « Réessayer ». */}
                    {errorCode === "TAVUS_CREDITS_EXHAUSTED" ? (
                      <>
                        <p className="mt-5 text-lg font-semibold">Crédits Tavus épuisés</p>
                        <p className="mt-1 max-w-md text-sm text-white/60">
                          Les crédits conversationnels Tavus sont épuisés. Rechargez le compte
                          Tavus avant de lancer une nouvelle simulation.
                        </p>
                        <ButtonLink href="/commercial/simulations" className="mt-5">
                          Retour aux simulations
                        </ButtonLink>
                      </>
                    ) : errorCode === "TAVUS_CONFIGURATION_ERROR" ||
                      errorCode === "TAVUS_UNAUTHORIZED" ? (
                      <>
                        <p className="mt-5 text-lg font-semibold">Service Tavus indisponible</p>
                        <p className="mt-1 max-w-md text-sm text-white/60">
                          {errorMessage}
                        </p>
                        <ButtonLink href="/commercial/simulations" className="mt-5">
                          Retour aux simulations
                        </ButtonLink>
                      </>
                    ) : (
                      <>
                        <p className="mt-5 text-lg font-semibold">
                          L&apos;appel n&apos;a pas pu démarrer
                        </p>
                        <p className="mt-1 max-w-sm text-sm text-white/60">
                          {errorMessage ?? "Une erreur est survenue. Vous pouvez réessayer."}
                        </p>
                        <Button onClick={startCall} className="mt-5">
                          Réessayer
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className="h-32 w-32 overflow-hidden rounded-full border border-white/10 sm:h-40 sm:w-40">
                      <CharacterAvatar tone="dark" />
                    </span>
                    <p className="mt-5 text-lg font-semibold">Julie Dupont</p>
                    <p className="mt-1 text-sm text-white/50">Cliente virtuelle — prête à démarrer</p>
                    <Button
                      onClick={startCall}
                      disabled={status === "starting"}
                      className="mt-5"
                    >
                      {status === "starting" ? (
                        <>
                          <Loader2 size={17} className="animate-spin" aria-hidden />
                          Connexion à Julie en cours…
                        </>
                      ) : (
                        "Démarrer l'appel avec Julie"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clôture Tavus en échec : l'entretien reste exploitable */}
        {endWarning ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3">
            <AlertTriangle size={17} className="shrink-0 text-warning" aria-hidden />
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-white/80">{endWarning}</p>
            <ButtonLink href="/commercial/analyse" variant="secondary">
              Poursuivre vers l&apos;analyse
            </ButtonLink>
          </div>
        ) : null}

        {/* Commandes */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 pb-6">
          <button
            type="button"
            onClick={() => setMicOn((value) => !value)}
            aria-pressed={micOn}
            className={cx(
              "flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors",
              micOn ? "bg-white/10 text-white hover:bg-white/15" : "bg-white/5 text-white/50",
            )}
          >
            {micOn ? <Mic size={17} aria-hidden /> : <MicOff size={17} aria-hidden />}
            {micOn ? "Microphone actif" : "Microphone coupé"}
          </button>

          <button
            type="button"
            onClick={() => setCameraOn((value) => !value)}
            aria-pressed={cameraOn}
            className={cx(
              "flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors",
              cameraOn ? "bg-white/10 text-white hover:bg-white/15" : "bg-white/5 text-white/50",
            )}
          >
            {cameraOn ? <Video size={17} aria-hidden /> : <VideoOff size={17} aria-hidden />}
            {cameraOn ? "Caméra active" : "Caméra coupée"}
          </button>

          <Button onClick={endCall} disabled={isEnding} variant="danger">
            <PhoneOff size={17} aria-hidden />
            {isEnding ? "Clôture en cours…" : "Terminer l'appel"}
          </Button>
        </div>
      </main>
    </div>
  );
}
