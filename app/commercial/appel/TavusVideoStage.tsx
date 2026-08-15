"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Daily, {
  type DailyCall,
  type DailyEventObjectAppMessage,
  type DailyEventObjectNetworkQualityEvent,
  type DailyParticipant,
} from "@daily-co/daily-js";
import { Loader2, Maximize2, Minimize2, VideoOff, Wifi, WifiOff } from "lucide-react";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
import { cx } from "@/src/lib/format";
import {
  createLatencyRecorder,
  readTavusEventName,
  type LatencyRecorder,
  type TurnLatencySample,
  IS_LATENCY_INSTRUMENTATION_ENABLED,
} from "@/src/lib/tavus/latency-metrics";

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
  micOn: boolean;
  cameraOn: boolean;
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
  // Affiché uniquement hors production : dernier tour mesuré.
  const [lastLatency, setLastLatency] = useState<TurnLatencySample | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useMediaTrack<HTMLVideoElement>(remoteVideo);
  const remoteAudioRef = useMediaTrack<HTMLAudioElement>(remoteAudio);
  const localVideoRef = useMediaTrack<HTMLVideoElement>(localVideo);

  // Les callbacks sont lus via ref : l'effet de connexion ne doit dépendre que
  // de `roomUrl`, sous peine de quitter puis rejoindre la salle à chaque rendu.
  const handlersRef = useRef({ onJoined, onJulieReady, onLeft, onError });
  useEffect(() => {
    handlersRef.current = { onJoined, onJulieReady, onLeft, onError };
  }, [onJoined, onJulieReady, onLeft, onError]);

  useEffect(() => {
    let call: DailyCall | null = null;
    let disposed = false;
    let julieAnnounced = false;
    // En production, l'enregistreur est un objet inerte : aucun horodatage,
    // aucun log, aucune allocation par événement.
    const latency: LatencyRecorder = createLatencyRecorder((sample) => {
      if (!disposed) setLastLatency(sample);
    });

    /** Recalcule les pistes affichées à partir de l'état complet des participants. */
    const syncTracks = () => {
      if (!call || disposed) return;
      const participants = call.participants();
      const local = participants.local;
      const remote = Object.values(participants).find((participant) => !participant.local);

      const remoteVideoTrack = readTrack(remote, "video");

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
          handlersRef.current.onJoined();
          syncTracks();
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
          const parsed = readTavusEventName(event.data);
          if (parsed) latency.recordTavusEvent(parsed.eventType, parsed.role);
        })
        // Indicateur réseau discret, sans test bloquant de trente secondes.
        .on("network-quality-change", (event?: DailyEventObjectNetworkQualityEvent) => {
          if (disposed || !event) return;
          setNetworkThreshold(event.threshold);
        })
        .on("left-meeting", () => {
          if (disposed) return;
          setConnection("ended");
          handlersRef.current.onLeft();
        })
        .on("error", () =>
          fail("La connexion à la salle vidéo a été perdue. Vous pouvez relancer un appel."),
        );

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

  // Les contrôles Nice-Matin pilotent directement les pistes locales Daily.
  useEffect(() => {
    void callObject?.setLocalAudio(micOn);
  }, [callObject, micOn]);

  useEffect(() => {
    void callObject?.setLocalVideo(cameraOn);
  }, [callObject, cameraOn]);

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
          <span className="h-24 w-24 overflow-hidden rounded-full border border-white/10 sm:h-32 sm:w-32">
            <CharacterAvatar tone="dark" />
          </span>
          <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
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

      {/* Mesure de latence — développement uniquement, jamais en production. */}
      {IS_LATENCY_INSTRUMENTATION_ENABLED && lastLatency ? (
        <div className="absolute left-3 bottom-3 rounded-sm bg-black/60 px-2.5 py-1.5 font-mono text-[11px] text-white/70 sm:left-4 sm:bottom-4">
          tour {lastLatency.turn} · réponse {lastLatency.totalMs} ms
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
