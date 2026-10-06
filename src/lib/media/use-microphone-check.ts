"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  probeCamera,
  probeMicrophone,
  readStoredMicId,
  startLevelMeter,
  storeMicId,
  type MicDevice,
  type MicFailure,
} from "@/src/lib/media/microphone";
import { logAudio } from "@/src/lib/media/audio-log";

export type CheckStatus = "idle" | "checking" | "ready" | "failed";
export type CameraStatus = "idle" | "checking" | "ok" | "failed";

export interface MicrophoneCheck {
  status: CheckStatus;
  failure: MicFailure | null;
  devices: MicDevice[];
  /** Périphérique réellement ouvert par le test, transmis à Daily pendant l'appel. */
  deviceId: string | null;
  /** Niveau sonore instantané, de 0 à 1. */
  level: number;
  camera: CameraStatus;
  cameraFailure: MicFailure | null;
  run: (deviceId?: string | null) => Promise<void>;
  select: (deviceId: string) => void;
  /** Libère le micro (arrête la mesure) sans changer le diagnostic affiché. */
  release: () => void;
  /** Force l'affichage d'un échec constaté ailleurs (ex. contrôle juste avant le lancement). */
  reportFailure: (failure: MicFailure) => void;
}

/**
 * Contrôle réel du micro et de la caméra : demande l'autorisation, ouvre une
 * piste, la vérifie et mesure son niveau. Le flux n'est jamais envoyé nulle
 * part et est arrêté au démontage.
 */
export function useMicrophoneCheck({ autoStart }: { autoStart: boolean }): MicrophoneCheck {
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [failure, setFailure] = useState<MicFailure | null>(null);
  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [camera, setCamera] = useState<CameraStatus>("idle");
  const [cameraFailure, setCameraFailure] = useState<MicFailure | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const stopMeterRef = useRef<(() => void) | null>(null);
  const runIdRef = useRef(0);

  const release = useCallback(() => {
    stopMeterRef.current?.();
    stopMeterRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLevel(0);
  }, []);

  const run = useCallback(
    async (requestedId?: string | null) => {
      const runId = (runIdRef.current += 1);
      release();
      setStatus("checking");
      setFailure(null);

      const md = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
      const probe = await probeMicrophone(md, requestedId ?? readStoredMicId());
      if (runId !== runIdRef.current) {
        if (probe.ok) probe.stream.getTracks().forEach((track) => track.stop());
        return;
      }

      if (!probe.ok) {
        logAudio("micro : contrôle en échec", { cause: probe.failure });
        setStatus("failed");
        setFailure(probe.failure);
      } else {
        logAudio("micro : permission accordée", { devices: probe.devices.length });
        logAudio("micro : piste créée", { selected: probe.deviceId ? "specifique" : "defaut" });
        streamRef.current = probe.stream;
        setDevices(probe.devices);
        setDeviceId(probe.deviceId);
        setStatus("ready");

        // La piste peut s'arrêter d'elle-même (débranchement) : on le constate.
        probe.stream.getAudioTracks().forEach((track) =>
          track.addEventListener("ended", () => {
            if (runId !== runIdRef.current) return;
            logAudio("micro : piste arrêtée pendant le contrôle");
            stopMeterRef.current?.();
            stopMeterRef.current = null;
            setLevel(0);
            setStatus("failed");
            setFailure("inactive");
          }),
        );

        let lastShown = -1;
        stopMeterRef.current = startLevelMeter(probe.stream, (value) => {
          const rounded = Math.round(value * 50) / 50;
          if (rounded === lastShown) return;
          lastShown = rounded;
          setLevel(rounded);
        });
      }

      // La caméra n'est pas bloquante : on l'indique, sans empêcher l'appel.
      setCamera("checking");
      setCameraFailure(null);
      const cam = await probeCamera(md);
      if (runId !== runIdRef.current) return;
      if (cam.ok) {
        setCamera("ok");
      } else {
        logAudio("caméra : contrôle en échec", { cause: cam.failure });
        setCamera("failed");
        setCameraFailure(cam.failure);
      }
    },
    [release],
  );

  const select = useCallback(
    (id: string) => {
      storeMicId(id);
      logAudio("micro : périphérique choisi");
      void run(id);
    },
    [run],
  );

  const reportFailure = useCallback(
    (cause: MicFailure) => {
      release();
      setStatus("failed");
      setFailure(cause);
    },
    [release],
  );

  // Démarrage différé d'un tour de boucle : aucune mise à jour d'état synchrone
  // depuis le corps de l'effet.
  useEffect(() => {
    if (!autoStart) return;
    const timer = window.setTimeout(() => void run(), 0);
    return () => window.clearTimeout(timer);
  }, [autoStart, run]);

  // Branchement ou débranchement d'un périphérique : la liste est relue.
  useEffect(() => {
    const md = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const onChange = () => {
      void md.enumerateDevices().then((all) => {
        const inputs = all
          .filter((device) => device.kind === "audioinput" && device.deviceId)
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${index + 1}`,
          }));
        setDevices(inputs);
      });
    };
    md.addEventListener("devicechange", onChange);
    return () => md.removeEventListener("devicechange", onChange);
  }, []);

  // Libération au démontage.
  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      stopMeterRef.current?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { status, failure, devices, deviceId, level, camera, cameraFailure, run, select, release, reportFailure };
}
