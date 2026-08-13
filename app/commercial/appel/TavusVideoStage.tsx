"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Daily, { type DailyCall, type DailyParticipant } from "@daily-co/daily-js";
import { Loader2, Maximize2, Minimize2, VideoOff } from "lucide-react";
import { CharacterAvatar } from "@/src/components/CharacterAvatar";
import { cx } from "@/src/lib/format";

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

export function TavusVideoStage({
  roomUrl,
  micOn,
  cameraOn,
  onJoined,
  onLeft,
  onError,
}: TavusVideoStageProps) {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [connection, setConnection] = useState<StageConnectionState>("connecting");
  const [remoteVideo, setRemoteVideo] = useState<MediaStreamTrack | null>(null);
  const [remoteAudio, setRemoteAudio] = useState<MediaStreamTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<MediaStreamTrack | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useMediaTrack<HTMLVideoElement>(remoteVideo);
  const remoteAudioRef = useMediaTrack<HTMLAudioElement>(remoteAudio);
  const localVideoRef = useMediaTrack<HTMLVideoElement>(localVideo);

  // Les callbacks sont lus via ref : l'effet de connexion ne doit dépendre que
  // de `roomUrl`, sous peine de quitter puis rejoindre la salle à chaque rendu.
  const handlersRef = useRef({ onJoined, onLeft, onError });
  useEffect(() => {
    handlersRef.current = { onJoined, onLeft, onError };
  }, [onJoined, onLeft, onError]);

  useEffect(() => {
    let call: DailyCall | null = null;
    let disposed = false;

    /** Recalcule les pistes affichées à partir de l'état complet des participants. */
    const syncTracks = () => {
      if (!call || disposed) return;
      const participants = call.participants();
      const local = participants.local;
      const remote = Object.values(participants).find((participant) => !participant.local);

      setLocalVideo(readTrack(local, "video"));
      setRemoteVideo(readTrack(remote, "video"));
      setRemoteAudio(readTrack(remote, "audio"));
      setConnection((current) =>
        current === "ended" || current === "error" ? current : remote ? "live" : "waiting",
      );
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
          handlersRef.current.onJoined();
          syncTracks();
        })
        .on("participant-joined", syncTracks)
        .on("participant-updated", syncTracks)
        .on("participant-left", syncTracks)
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
              ? "Connexion à la salle vidéo…"
              : connection === "waiting"
                ? "Julie rejoint l'appel…"
                : connection === "ended"
                  ? "L'appel est terminé."
                  : connection === "error"
                    ? "Connexion interrompue."
                    : "Julie arrive…"}
          </p>
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
