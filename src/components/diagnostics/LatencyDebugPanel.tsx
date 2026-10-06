"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/src/components/Button";
import { cx } from "@/src/lib/format";
import {
  clearLatencyMeasurements,
  disableLatencyDebug,
  getLatencySnapshot,
  isLatencyDebugEnabled,
  subscribeLatency,
} from "@/src/lib/tavus/latency-store";
import { formatLatencyReport } from "@/src/lib/tavus/latency-turns";

/** Copie un texte dans le presse-papiers, avec repli pour les contextes sans API moderne. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Retire `latencyDebug` de l'URL, sans quoi la page se réactiverait au rechargement. */
function stripDebugParam(): void {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("latencyDebug")) {
      url.searchParams.delete("latencyDebug");
      window.history.replaceState(null, "", url.toString());
    }
  } catch {
    // Sans conséquence : le panneau se refermera au prochain rechargement.
  }
}

/**
 * Panneau de diagnostic de latence, visible uniquement en mode `latencyDebug`.
 * Affiche le rapport texte (timestamps et durées, aucun contenu de conversation)
 * et permet de le copier. Les mesures survivent à la navigation vers l'analyse.
 */
export function LatencyDebugPanel({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const enabled = useSyncExternalStore(subscribeLatency, isLatencyDebugEnabled, () => false);
  const session = useSyncExternalStore(subscribeLatency, getLatencySnapshot, () => null);
  const [copied, setCopied] = useState<"idle" | "ok" | "error">("idle");

  if (!enabled) return null;

  const dark = tone === "dark";
  const report = session ? formatLatencyReport(session) : null;

  return (
    <section
      aria-label="Diagnostic de latence"
      className={cx(
        "rounded-md border p-4 text-left",
        dark ? "border-white/15 bg-white/5 text-white" : "border-line bg-white text-ink",
        className,
      )}
    >
      <p className="text-sm font-semibold">Diagnostic de latence (mode test)</p>
      <p className={cx("mt-1 text-xs leading-relaxed", dark ? "text-white/60" : "text-graphite")}>
        Uniquement des horodatages et des états techniques : aucun audio, aucun texte. Les mesures sont
        conservées dans ce navigateur le temps de la session.
      </p>

      {report ? (
        <pre
          className={cx(
            "mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-sm p-3 font-mono text-[11px] leading-relaxed",
            dark ? "bg-black/40 text-white/80" : "bg-mist text-ink",
          )}
        >
          {report}
        </pre>
      ) : (
        <p className={cx("mt-3 text-sm", dark ? "text-white/70" : "text-graphite")}>
          Aucune mesure pour le moment. Lancez un appel avec Julie.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={!report}
          onClick={async () => {
            if (!report) return;
            setCopied((await copyText(report)) ? "ok" : "error");
          }}
        >
          Copier les mesures
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            clearLatencyMeasurements();
            setCopied("idle");
          }}
        >
          Effacer les mesures
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            stripDebugParam();
            disableLatencyDebug();
          }}
        >
          Quitter le mode diagnostic
        </Button>
        {copied === "ok" ? <span className="text-xs text-positive">Mesures copiées.</span> : null}
        {copied === "error" ? <span className="text-xs text-danger">Copie impossible : sélectionnez le texte.</span> : null}
      </div>
    </section>
  );
}
