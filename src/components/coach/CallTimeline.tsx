"use client";

import { useMemo, useState } from "react";
import { MousePointerClick } from "lucide-react";
import type { CoachKeyMoment, CoachMissedOpportunity } from "@/src/types/coach";
import { KEY_MOMENT_META } from "@/src/components/coach/CoachShared";
import { cx, formatTimer } from "@/src/lib/format";

/** Repère unifié : un moment clé du Coach ou une occasion manquée. */
interface Marker {
  key: string;
  kind: "moment" | "missed";
  seconds: number;
  title: string;
  explanation: string;
  type: CoachKeyMoment["type"] | null;
  /** Position en pourcentage sur le rail, après écartement des collisions. */
  left: number;
}

/**
 * Largeur minimale du rail, en pixels. En dessous, la chronologie défile
 * horizontalement plutôt que de tasser les repères les uns sur les autres.
 */
const RAIL_MIN_WIDTH = 760;

/** Écart minimal entre deux pastilles, exprimé en pourcentage du rail. */
const MIN_GAP_PERCENT = (34 / RAIL_MIN_WIDTH) * 100;

/**
 * Écarte les repères trop proches pour qu'aucune pastille n'en recouvre une
 * autre. Seule la position visuelle bouge : l'horodatage affiché reste celui
 * du Coach.
 */
function layout(markers: Omit<Marker, "left">[], durationSeconds: number): Marker[] {
  const safeDuration = durationSeconds > 0 ? durationSeconds : 1;
  const sorted = [...markers].sort((a, b) => a.seconds - b.seconds);

  const placed: Marker[] = [];
  let previous = -Infinity;

  for (const marker of sorted) {
    const raw = Math.min(100, Math.max(0, (marker.seconds / safeDuration) * 100));
    const left = Math.min(100, Math.max(raw, previous + MIN_GAP_PERCENT));
    placed.push({ ...marker, left });
    previous = left;
  }

  return placed;
}

interface CallTimelineProps {
  moments: CoachKeyMoment[];
  missed: CoachMissedOpportunity[];
  durationSeconds: number;
  className?: string;
}

/**
 * Chronologie interactive de l'appel.
 *
 * Le compte rendu liste les moments clés, mais une liste ne montre pas *quand*
 * l'entretien a basculé ni à quelle distance les incidents se suivent.
 *
 * Les libellés ne sont plus posés sur le rail : ils s'y chevauchaient et
 * étaient tronqués. Le rail ne porte que des pastilles numérotées ; le texte
 * complet du repère sélectionné s'affiche en dessous, en pleine largeur.
 */
export function CallTimeline({
  moments,
  missed,
  durationSeconds,
  className,
}: CallTimelineProps) {
  const markers = useMemo(() => {
    const fromMoments: Omit<Marker, "left">[] = moments.map((moment, index) => ({
      key: `m-${index}-${moment.timestampSeconds}`,
      kind: "moment",
      seconds: moment.timestampSeconds,
      title: moment.title,
      explanation: moment.explanation,
      type: moment.type,
    }));

    const fromMissed: Omit<Marker, "left">[] = missed
      .filter((item) => typeof item.timestampSeconds === "number")
      .map((item, index) => ({
        key: `o-${index}-${item.timestampSeconds}`,
        kind: "missed",
        seconds: item.timestampSeconds as number,
        title: item.title,
        explanation: item.explanation,
        type: null,
      }));

    return layout([...fromMoments, ...fromMissed], durationSeconds);
  }, [moments, missed, durationSeconds]);

  // Sélection par défaut : le moment de bascule s'il existe, sinon le premier.
  const defaultKey =
    markers.find((marker) => marker.type === "turning_point")?.key ?? markers[0]?.key ?? "";
  const [selectedKey, setSelectedKey] = useState(defaultKey);

  const selected = markers.find((marker) => marker.key === selectedKey) ?? markers[0];

  if (markers.length === 0) {
    return (
      <p className={cx("text-sm leading-relaxed text-graphite", className)}>
        Aucun repère horodaté n&apos;a été relevé sur cet échange.
      </p>
    );
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    label: formatTimer(Math.round(durationSeconds * ratio)),
  }));

  return (
    <div className={className}>
      <p className="mb-4 flex items-center gap-2 text-[13px] text-graphite">
        <MousePointerClick size={15} className="shrink-0 text-brand" aria-hidden />
        Cliquez un repère pour lire ce que le Coach a relevé à ce moment-là.
      </p>

      {/* Le rail défile horizontalement plutôt que de tasser les pastilles. */}
      <div className="nm-scroll -mx-1 overflow-x-auto px-1 pb-2">
        <div style={{ minWidth: RAIL_MIN_WIDTH }}>
          <div className="relative h-9">
            {markers.map((marker, index) => {
              const meta = marker.type ? KEY_MOMENT_META[marker.type] : null;
              const active = marker.key === selected?.key;
              return (
                <button
                  key={marker.key}
                  type="button"
                  onClick={() => setSelectedKey(marker.key)}
                  aria-pressed={active}
                  title={`${formatTimer(marker.seconds)} — ${marker.title}`}
                  className={cx(
                    "absolute top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-all",
                    active
                      ? "scale-110 text-white shadow-lift ring-2 ring-white"
                      : "text-white opacity-75 hover:opacity-100",
                    marker.kind === "missed"
                      ? "bg-warning-bright text-ink"
                      : (meta?.dot ?? "bg-brand"),
                  )}
                  style={{ left: `${marker.left}%` }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Rail de la durée */}
          <div className="relative mt-1 h-1.5 rounded-full bg-gradient-to-r from-brand-sky via-brand-accent to-brand">
            {markers.map((marker) => (
              <span
                key={`tick-${marker.key}`}
                aria-hidden
                className={cx(
                  "absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full",
                  marker.key === selected?.key ? "bg-ink" : "bg-white/50",
                )}
                style={{ left: `${marker.left}%` }}
              />
            ))}
          </div>

          {/* Graduations de durée */}
          <div className="relative mt-2 h-4">
            {ticks.map((tick) => (
              <span
                key={tick.ratio}
                className={cx(
                  "absolute font-mono text-[10px] tabular-nums text-muted",
                  tick.ratio === 0
                    ? "left-0"
                    : tick.ratio === 1
                      ? "right-0"
                      : "-translate-x-1/2",
                )}
                style={tick.ratio === 0 || tick.ratio === 1 ? undefined : { left: `${tick.ratio * 100}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Détail du repère sélectionné, en pleine largeur : rien n'est tronqué. */}
      {selected ? (
        <div
          className={cx(
            "mt-5 rounded-md border-l-[3px] p-4",
            selected.kind === "missed"
              ? "border-l-warning-bright bg-warning-soft"
              : "border-l-brand bg-brand-soft",
          )}
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-sm font-semibold tabular-nums text-ink">
              {formatTimer(selected.seconds)}
            </span>
            <span
              className={cx(
                "text-[11px] font-semibold uppercase tracking-[0.1em]",
                selected.kind === "missed"
                  ? "text-warning"
                  : (selected.type ? KEY_MOMENT_META[selected.type].text : "text-brand"),
              )}
            >
              {selected.kind === "missed"
                ? "Occasion manquée"
                : selected.type
                  ? KEY_MOMENT_META[selected.type].label
                  : "Repère"}
            </span>
          </div>
          <p className="mt-2 text-base font-semibold leading-snug text-ink">{selected.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-graphite">{selected.explanation}</p>
        </div>
      ) : null}

      {/* Tous les repères en clair : la chronologie reste lisible sans clic. */}
      <ol className="mt-4 space-y-1.5">
        {markers.map((marker, index) => {
          const meta = marker.type ? KEY_MOMENT_META[marker.type] : null;
          const active = marker.key === selected?.key;
          return (
            <li key={`row-${marker.key}`}>
              <button
                type="button"
                onClick={() => setSelectedKey(marker.key)}
                className={cx(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors",
                  active ? "bg-mist" : "hover:bg-mist/60",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums text-white",
                    marker.kind === "missed" ? "bg-warning-bright text-ink" : (meta?.dot ?? "bg-brand"),
                  )}
                >
                  {index + 1}
                </span>
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-muted">
                  {formatTimer(marker.seconds)}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug text-ink">{marker.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Légende du schéma : rappelle ce que signifie chaque couleur de pastille. */
export function CallTimelineLegend({ types }: { types: CoachKeyMoment["type"][] }) {
  const unique = [...new Set(types)];
  return (
    <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
      {unique.map((type) => {
        const meta = KEY_MOMENT_META[type];
        return (
          <li key={type} className="flex items-center gap-2 text-xs text-graphite">
            <span className={cx("h-2.5 w-2.5 rounded-full", meta.dot)} aria-hidden />
            {meta.label}
          </li>
        );
      })}
      <li className="flex items-center gap-2 text-xs text-graphite">
        <span className="h-2.5 w-2.5 rounded-full bg-warning-bright" aria-hidden />
        Occasion manquée
      </li>
    </ul>
  );
}
