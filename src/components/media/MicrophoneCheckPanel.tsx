import { AlertTriangle, Loader2, Mic, Video } from "lucide-react";
import { Button } from "@/src/components/Button";
import { cx } from "@/src/lib/format";
import { MIC_FAILURE_MESSAGES } from "@/src/lib/media/microphone";
import type { MicrophoneCheck } from "@/src/lib/media/use-microphone-check";

/**
 * Contrôle réel du microphone : état détecté, jauge de niveau en direct,
 * sélecteur de périphérique et diagnostic en cas d'échec.
 *
 * `tone="dark"` pour la salle d'appel, `tone="light"` pour la page de préparation.
 */
export function MicrophoneCheckPanel({
  check,
  tone = "light",
  className,
}: {
  check: MicrophoneCheck;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  const muted = dark ? "text-white/60" : "text-graphite";
  const strong = dark ? "text-white" : "text-ink";
  const failed = check.status === "failed";
  const ready = check.status === "ready";
  const checking = check.status === "checking";

  return (
    <div
      className={cx(
        "rounded-md border p-4 text-left",
        dark ? "border-white/10 bg-white/5" : "border-line bg-white",
        className,
      )}
    >
      <p className={cx("flex items-center gap-2 text-sm font-semibold", strong)}>
        <Mic size={16} aria-hidden />
        Microphone
      </p>

      {check.status === "idle" ? (
        <>
          <p className={cx("mt-2 text-sm", muted)}>
            Testez votre microphone et votre caméra avant de lancer l&apos;appel.
          </p>
          <Button className="mt-3" variant="secondary" onClick={() => void check.run()}>
            Tester mon matériel
          </Button>
        </>
      ) : null}

      {checking ? (
        <p className={cx("mt-2 flex items-center gap-2 text-sm", muted)}>
          <Loader2 size={15} className="animate-spin" aria-hidden />
          Vérification du microphone…
        </p>
      ) : null}

      {ready ? (
        <>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-positive">
            <span className="h-2 w-2 rounded-full bg-positive" aria-hidden />
            Détecté
          </p>

          <div
            role="meter"
            aria-label="Niveau sonore du microphone"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(check.level * 100)}
            className={cx("mt-3 h-2.5 w-full overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-mist")}
          >
            <div
              className="h-full rounded-full bg-positive transition-[width] duration-75"
              style={{ width: `${Math.round(check.level * 100)}%` }}
            />
          </div>
          <p className={cx("mt-2 text-xs leading-relaxed", muted)}>
            Parlez quelques secondes pour tester votre microphone. Rien n&apos;est enregistré ni envoyé.
          </p>

          {check.devices.length > 1 ? (
            <label className="mt-3 block">
              <span className={cx("text-xs font-medium", muted)}>Choisir un microphone</span>
              <select
                value={check.deviceId ?? ""}
                onChange={(event) => check.select(event.target.value)}
                className={cx(
                  "mt-1 w-full rounded-sm border px-2.5 py-2 text-sm",
                  dark ? "border-white/15 bg-ink text-white" : "border-line bg-white text-ink",
                )}
              >
                {check.devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : null}

      {failed && check.failure ? (
        <div className="mt-2" role="alert">
          <p className="flex gap-2 text-sm font-medium text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {check.failure === "absent" ? "Votre microphone n'est pas détecté." : "Microphone inutilisable."}
          </p>
          <p className={cx("mt-1.5 text-sm leading-relaxed", muted)}>
            {MIC_FAILURE_MESSAGES[check.failure]}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void check.run()}>
              Réessayer
            </Button>
          </div>
          {check.devices.length > 1 ? (
            <label className="mt-3 block">
              <span className={cx("text-xs font-medium", muted)}>Choisir un microphone</span>
              <select
                value={check.deviceId ?? ""}
                onChange={(event) => check.select(event.target.value)}
                className={cx(
                  "mt-1 w-full rounded-sm border px-2.5 py-2 text-sm",
                  dark ? "border-white/15 bg-ink text-white" : "border-line bg-white text-ink",
                )}
              >
                {check.devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {check.camera !== "idle" ? (
        <p className={cx("mt-4 flex items-center gap-2 border-t pt-3 text-xs", dark ? "border-white/10" : "border-line", muted)}>
          <Video size={14} aria-hidden />
          {check.camera === "checking"
            ? "Vérification de la caméra…"
            : check.camera === "ok"
              ? "Caméra détectée."
              : check.cameraFailure === "denied"
                ? "Caméra refusée : autorisez-la dans votre navigateur (l'appel reste possible)."
                : "Caméra non détectée (l'appel reste possible)."}
        </p>
      ) : null}
    </div>
  );
}
