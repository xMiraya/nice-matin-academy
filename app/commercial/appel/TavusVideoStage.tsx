"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Daily, {
  type DailyCall,
  type DailyEventObjectAppMessage,
  type DailyEventObjectCameraError,
  type DailyEventObjectNetworkQualityEvent,
  type DailyEventObjectNonFatalError,
  type DailyEventObjectRemoteParticipantsAudioLevel,
  type DailyEventObjectTrack,
  type DailyParticipant,
} from "@daily-co/daily-js";
import { Loader2, Maximize2, Minimize2, VideoOff, Wifi, WifiOff } from "lucide-react";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
import { cx } from "@/src/lib/format";
import {
  createLatencyRecorder,
  readTavusEnvelope,
  type LatencyRecorder,
} from "@/src/lib/tavus/latency-metrics";
import { isLatencyDebugEnabled } from "@/src/lib/tavus/latency-store";
import { logAudio } from "@/src/lib/media/audio-log";
import { deriveMicRuntime, type MicRuntime } from "@/src/lib/media/mic-runtime";

/** Délai laissé au micro pour publier sa piste avant de la déclarer perdue. */
const MIC_SETTLE_MS = 5_000;
/** Attente avant de juger le résultat d'une tentative de réactivation. */
const MIC_RECOVER_WAIT_MS = 2_500;

/**
 * Scène vidéo de l'appel avec Julie.
 *
 * Le mode « call object » de `@daily-co/daily-js` est utilisé plutôt que
 * l'interface Daily Prebuilt : Prebuilt est une iframe cross-origin, donc
 * impossible à styler depuis notre DOM (barre blanche, boutons People / Share /
 * Speaker view, nom technique de la salle). En call object, Daily ne fournit que
 * les pistes média ; toute l'interface — cadre 16:9, vignette locale, contrôles —
 * appartient à Nice-Matin Academy.
 */

export type StageConnectionState = "connecting" | "waiting" | "live" | "ended" | "error";

interface TavusVideoStageProps {
  /** URL de salle Daily renvoyée par Tavus (`conversation_url`). */
  roomUrl: string;
  /** Souhait de l'utilisateur : ne dit rien de l'état réel, lu sur la piste Daily. */
  micOn: boolean;
  cameraOn: boolean;
  /** Périphérique choisi pendant le contrôle avant appel (`null` : micro par défaut). */
  micDeviceId: string | null;
  /** Incrémenté par l'interface pour demander une réactivation du micro. */
  recoverSignal: number;
  /** État réel du micro, déduit de la piste locale publiée dans Daily. */
  onMicState: (state: MicRuntime) => void;
  /** Résultat d'une réactivation demandée. */
  onRecoverResult: (recovered: boolean) => void;
  /** Déclenché une seule fois, au moment où le commercial a rejoint la salle. */
  onJoined: () => void;
  /**
   * Déclenché quand Julie est réellement présente **et** que sa vidéo est
   * exploitable. C'est ce moment — et lui seul — qui démarre le chronomètre.
   */
  onJulieReady: () => void;
  /** Déclenché si la salle se ferme d'elle-même (fin Tavus, expiration, kick). */
  onLeft: () => void;
  onError: (message: string) => void;
}

/** Première piste exploitable d'un participant, `null` si coupée ou absente. */
function readTrack(
  participant: DailyParticipant | undefined,
  kind: "video" | "audio",
): MediaStreamTrack | null {
  const track = participant?.tracks?.[kind];
  if (!track || track.state === "off" || track.state === "blocked") return null;
  return track.persistentTrack ?? null;
}

/** Attache une piste à un élément média, sans recréer le flux inutilement. */
function useMediaTrack<T extends HTMLMediaElement>(track: MediaStreamTrack | null) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!track) {
      element.srcObject = null;
      return;
    }

    element.srcObject = new MediaStream([track]);
    // Safari et Chrome peuvent rejeter la lecture automatique : sans conséquence,
    // l'utilisateur a déjà interagi en cliquant sur « Démarrer l'appel ».
    void element.play().catch(() => undefined);
  }, [track]);

  return ref;
}

function TavusVideoStageComponent({
  roomUrl,
  micOn,
  cameraOn,
  micDeviceId,
  recoverSignal,
  onMicState,
  onRecoverResult,
  onJoined,
  onJulieReady,
  onLeft,
  onError,
}: TavusVideoStageProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [connection, setConnection] = useState<StageConnectionState>("connecting");
  const [remoteVideo, setRemoteVideo] = useState<MediaStreamTrack | null>(null);
  const [remoteAudio, setRemoteAudio] = useState<MediaStreamTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<MediaStreamTrack | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkThreshold, setNetworkThreshold] = useState<"good" | "low" | "very-low" | null>(
    null,
  );

  const [joined, setJoined] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useMediaTrack<HTMLVideoElement>(remoteVideo);
  const remoteAudioRef = useMediaTrack<HTMLAudioElement>(remoteAudio);
  const localVideoRef = useMediaTrack<HTMLVideoElement>(localVideo);

  // Les callbacks sont lus via ref : l'effet de connexion ne doit dépendre que
  // de `roomUrl`, sous peine de quitter puis rejoindre la salle à chaque rendu.
  const handlersRef = useRef({ onJoined, onJulieReady, onLeft, onError, onMicState, onRecoverResult });
  useEffect(() => {
    handlersRef.current = { onJoined, onJulieReady, onLeft, onError, onMicState, onRecoverResult };
  }, [onJoined, onJulieReady, onLeft, onError, onMicState, onRecoverResult]);

  // Lues par l'évaluation de l'état réel du micro, sans relancer la connexion.
  const micWantedRef = useRef(micOn);
  const micDeviceRef = useRef(micDeviceId);
  const evaluateMicRef = useRef<() => MicRuntime>(() => "pending");
  useEffect(() => {
    micWantedRef.current = micOn;
    micDeviceRef.current = micDeviceId;
    evaluateMicRef.current();
  }, [micOn, micDeviceId]);

  useEffect(() => {
    let call: DailyCall | null = null;
    let disposed = false;
    let julieAnnounced = false;
    let joinedMeeting = false;
    let settled = false;
    let settleTimer: number | undefined;
    let lastMicRuntime: MicRuntime | null = null;
    // Sans `?latencyDebug=1`, l'enregistreur est un objet inerte : aucun
    // horodatage, aucun log, aucun observateur Daily, aucun stockage.
    const latency: LatencyRecorder = createLatencyRecorder({ enabled: isLatencyDebugEnabled() });

    /**
     * État réel du micro : lu sur la piste audio locale publiée dans Daily, jamais
     * déduit d'un simple booléen d'interface ni d'une autorisation accordée.
     */
    const evaluateMic = (): MicRuntime => {
      const localAudio = call && !disposed ? call.participants().local?.tracks?.audio : undefined;
      const runtime = deriveMicRuntime({
        joined: joinedMeeting,
        wanted: micWantedRef.current,
        settled,
        trackState: localAudio?.state,
        track: localAudio?.persistentTrack ?? null,
      });
      if (runtime !== lastMicRuntime) {
        lastMicRuntime = runtime;
        logAudio("micro : état réel", { etat: runtime, piste: localAudio?.state ?? "absente" });
        handlersRef.current.onMicState(runtime);
      }
      return runtime;
    };
    evaluateMicRef.current = evaluateMic;

    /** Après la jonction : choisit le périphérique puis active le micro, et vérifie la piste. */
    const configureMic = async () => {
      if (!call || disposed) return;
      const current = call;
      try {
        if (micDeviceRef.current) {
          await current.setInputDevicesAsync({ audioDeviceId: micDeviceRef.current });
        }
      } catch {
        logAudio("micro : périphérique non appliqué");
      }
      if (disposed) return;
      current.setLocalAudio(micWantedRef.current);
      settleTimer = window.setTimeout(() => {
        settled = true;
        evaluateMic();
      }, MIC_SETTLE_MS);
      evaluateMic();
    };

    /** Recalcule les pistes affichées à partir de l'état complet des participants. */
    const syncTracks = () => {
      if (!call || disposed) return;
      const participants = call.participants();
      const local = participants.local;
      const remote = Object.values(participants).find((participant) => !participant.local);

      const remoteVideoTrack = readTrack(remote, "video");

      evaluateMic();
      setLocalVideo(readTrack(local, "video"));
      setRemoteVideo(remoteVideoTrack);
      setRemoteAudio(readTrack(remote, "audio"));
      setConnection((current) =>
        current === "ended" || current === "error" ? current : remote ? "live" : "waiting",
      );

      // Julie n'est « prête » que présente ET avec une piste vidéo exploitable :
      // c'est ce signal qui démarre le chronomètre côté CallRoom, une seule fois.
      if (!julieAnnounced && remote && remoteVideoTrack) {
        julieAnnounced = true;
        latency.recordLifecycle("julie-ready");
        handlersRef.current.onJulieReady();
      }
    };

    const fail = (message: string) => {
      if (disposed) return;
      setConnection("error");
      handlersRef.current.onError(message);
    };

    // La connexion est pilotée depuis une tâche asynchrone : l'effet se contente
    // de s'abonner au système externe qu'est Daily, sans rendu en cascade.
    const connect = async () => {
      try {
        // Daily n'autorise qu'une instance de call object à la fois : celle-ci
        // est systématiquement détruite au démontage (voir le nettoyage).
        call = Daily.createCallObject({
          url: roomUrl,
          subscribeToTracksAutomatically: true,
          // Le micro n'est activé qu'après `joined-meeting`, avec vérification de
          // la piste réellement publiée (voir `configureMic`).
          startAudioOff: true,
          ...(micDeviceRef.current ? { audioSource: micDeviceRef.current } : {}),
        });
      } catch {
        fail("La salle vidéo n'a pas pu être initialisée. Rechargez la page puis réessayez.");
        return;
      }

      if (disposed) {
        void call.destroy().catch(() => undefined);
        call = null;
        return;
      }

      call
        .on("joined-meeting", () => {
          if (disposed) return;
          latency.recordLifecycle("joined-meeting");
          // Mesure du premier audio distant (T4) : uniquement en mode diagnostic.
          if (latency.enabled) {
            void call?.startRemoteParticipantsAudioLevelObserver(100).catch(() => undefined);
          }
          joinedMeeting = true;
          setJoined(true);
          logAudio("daily : salle rejointe");
          handlersRef.current.onJoined();
          syncTracks();
          void configureMic();
        })
        .on("track-started", (event?: DailyEventObjectTrack) => {
          if (disposed || !event?.participant?.local || event.type !== "audio") return;
          logAudio("micro : piste démarrée");
          evaluateMic();
        })
        .on("track-stopped", (event?: DailyEventObjectTrack) => {
          if (disposed || !event?.participant?.local || event.type !== "audio") return;
          logAudio("micro : piste arrêtée");
          evaluateMic();
        })
        .on("camera-error", (event?: DailyEventObjectCameraError) => {
          if (disposed) return;
          logAudio("daily : erreur de capture", {
            cause: event?.error?.type ?? "inconnue",
            audioOk: event?.errorMsg?.audioOk ?? null,
            videoOk: event?.errorMsg?.videoOk ?? null,
          });
          evaluateMic();
        })
        .on("nonfatal-error", (event?: DailyEventObjectNonFatalError) => {
          if (disposed) return;
          logAudio("daily : erreur non fatale", { type: event?.type ?? "inconnu" });
          evaluateMic();
        })
        .on("participant-joined", (event) => {
          if (event && !event.participant.local) latency.recordLifecycle("participant-joined");
          syncTracks();
        })
        .on("participant-updated", syncTracks)
        .on("participant-left", syncTracks)
        // Messages applicatifs Tavus : seuls le nom d'événement et le rôle du
        // locuteur sont lus. Le contenu (`properties.speech`, transcript…) n'est
        // jamais consulté ni journalisé.
        .on("app-message", (event?: DailyEventObjectAppMessage) => {
          if (disposed || !event) return;
          if (!latency.enabled) return;
          // Enveloppe technique uniquement (type, rôle, horodatage, seq, tour).
          const envelope = readTavusEnvelope(event.data);
          if (envelope) latency.recordTavusEvent(envelope);
        })
        // Indicateur réseau discret, sans test bloquant de trente secondes.
        .on("network-quality-change", (event?: DailyEventObjectNetworkQualityEvent) => {
          if (disposed || !event) return;
          setNetworkThreshold(event.threshold);
          if (latency.enabled) latency.recordNetwork(event.threshold);
        })
        .on("left-meeting", () => {
          if (disposed) return;
          setConnection("ended");
          handlersRef.current.onLeft();
        })
        .on("error", () =>
          fail("La connexion à la salle vidéo a été perdue. Vous pouvez relancer un appel."),
        );

      if (latency.enabled) {
        call.on("remote-participants-audio-level", (event?: DailyEventObjectRemoteParticipantsAudioLevel) => {
          if (disposed || !event) return;
          latency.recordRemoteAudioLevel(Math.max(0, ...Object.values(event.participantsAudioLevel ?? {})));
        });
      }

      setCallObject(call);

      try {
        await call.join();
      } catch {
        fail(
          "Impossible de rejoindre la salle vidéo. Vérifiez l'accès à votre caméra et à votre micro.",
        );
      }
    };

    void connect();

    return () => {
      disposed = true;
      if (settleTimer !== undefined) window.clearTimeout(settleTimer);
      evaluateMicRef.current = () => "pending";
      setJoined(false);
      const leaving = call;
      call = null;
      setCallObject(null);
      // `leave` puis `destroy` : sans destruction, Daily refuse toute nouvelle
      // instance et le second appel de la session échouerait.
      void leaving
        ?.leave()
        .catch(() => undefined)
        .finally(() => void leaving.destroy().catch(() => undefined));
    };
  }, [roomUrl]);

  // Les contrôles Nice-Matin pilotent les pistes locales Daily, mais seulement
  // une fois la salle rejointe : avant `joined-meeting`, un appel à
  // `setLocalAudio` ne prouve rien.
  useEffect(() => {
    if (!callObject || !joined) return;
    callObject.setLocalAudio(micOn);
    logAudio(micOn ? "micro : activé" : "micro : coupé par l'utilisateur");
  }, [callObject, joined, micOn]);

  useEffect(() => {
    if (!callObject || !joined) return;
    callObject.setLocalVideo(cameraOn);
  }, [callObject, joined, cameraOn]);

  // Réactivation demandée après une perte du micro.
  useEffect(() => {
    if (recoverSignal === 0 || !callObject || !joined) return;
    let cancelled = false;
    const recover = async () => {
      logAudio("micro : réactivation demandée");
      try {
        callObject.setLocalAudio(false, { forceDiscardTrack: true });
        if (micDeviceRef.current) {
          await callObject.setInputDevicesAsync({ audioDeviceId: micDeviceRef.current });
        }
        callObject.setLocalAudio(true);
      } catch {
        logAudio("micro : réactivation en erreur");
      }
      await new Promise((resolve) => setTimeout(resolve, MIC_RECOVER_WAIT_MS));
      if (cancelled) return;
      const recovered = evaluateMicRef.current() === "active";
      logAudio("micro : résultat de la réactivation", { reussi: recovered });
      handlersRef.current.onRecoverResult(recovered);
    };
    void recover();
    return () => {
      cancelled = true;
    };
    // Déclenchée uniquement par une nouvelle demande.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoverSignal]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
      return;
    }
    void stageRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const isJulieVisible = connection === "live" && remoteVideo !== null;

  return (
    <div
      ref={stageRef}
      className="relative aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-[#0f0f11]"
    >
      {/* Julie occupe toute la scène. `object-contain` plutôt que `cover` :
          le flux Tavus est déjà en 16:9, et un recadrage couperait le visage
          si le ratio venait à changer. */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        className={cx(
          "h-full w-full object-contain transition-opacity duration-300",
          isJulieVisible ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Piste audio séparée : la vidéo reste muette pour éviter tout double son. */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {!isJulieVisible ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {/*
            Le décor de Julie pendant que la liaison s'établit : très assombri,
            il occupe l'attente sans laisser croire que l'appel a commencé.
          */}
          <Image
            src="/images/julie/julie-dupont-contexte.jpg"
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none select-none object-cover"
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-brand-dark/90" />
          <span className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10 sm:h-32 sm:w-32">
            <CharacterAvatar tone="dark" />
          </span>
          <p className="relative mt-4 flex items-center gap-2 text-sm text-white/70">
            {connection === "error" ? null : (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            )}
            {connection === "connecting"
              ? "Connexion audio et vidéo…"
              : connection === "waiting"
                ? "Préparation de Julie…"
                : connection === "ended"
                  ? "L'appel est terminé."
                  : connection === "error"
                    ? "Connexion interrompue."
                    : "Préparation de Julie…"}
          </p>
        </div>
      ) : null}

      {/* Indicateur réseau discret : affiché seulement quand la qualité se dégrade. */}
      {networkThreshold && networkThreshold !== "good" ? (
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-sm bg-black/60 px-2.5 py-1.5 text-xs text-white/80 sm:left-4 sm:top-4">
          {networkThreshold === "very-low" ? (
            <WifiOff size={14} className="text-danger" aria-hidden />
          ) : (
            <Wifi size={14} className="text-warning" aria-hidden />
          )}
          {networkThreshold === "very-low" ? "Réseau très instable" : "Réseau instable"}
        </div>
      ) : null}

      {/* Vignette locale discrète, en bas à droite. */}
      <div className="absolute bottom-3 right-3 w-24 overflow-hidden rounded-sm border border-white/15 bg-black/70 shadow-lg sm:bottom-4 sm:right-4 sm:w-36">
        <div className="relative flex aspect-video items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={cx(
              "h-full w-full object-cover",
              cameraOn && localVideo ? "opacity-100" : "opacity-0",
            )}
          />
          {!cameraOn || !localVideo ? (
            <VideoOff
              size={16}
              className="absolute text-white/40"
              aria-label="Caméra coupée"
            />
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute right-3 top-3 rounded-sm bg-black/50 p-2 text-white/70 transition-colors hover:bg-black/70 hover:text-white sm:right-4 sm:top-4"
      >
        {isFullscreen ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
        <span className="sr-only">
          {isFullscreen ? "Quitter le plein écran" : "Passer en plein écran"}
        </span>
      </button>
    </div>
  );
}

/**
 * Mémoïsé : le chronomètre de `CallRoom` provoque un rendu par seconde. Sans
 * cette barrière, toute la scène vidéo serait re-rendue soixante fois par
 * minute pendant l'entretien, sans qu'aucune de ses props n'ait changé.
 */
export const TavusVideoStage = memo(TavusVideoStageComponent);
