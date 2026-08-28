"use client";

import { useCallback, useState } from "react";
import { cx } from "@/src/lib/format";

/**
 * Portrait du personnage virtuel Julie Dupont.
 *
 * Si un visuel est déposé dans `public/images/julie-dupont.png`, il est affiché
 * tel quel. Tant qu'il n'existe pas, on retombe sur une illustration dessinée
 * localement en SVG : aucune photographie externe n'est chargée, et l'écran ne
 * montre jamais d'image cassée.
 */
export const JULIE_PORTRAIT_SRC = "/images/julie-dupont.png";

export function CharacterAvatar({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const [portraitFailed, setPortraitFailed] = useState(false);

  /*
    `onError` ne suffit pas : quand le fichier est absent, l'échec de chargement
    a déjà eu lieu au moment où React attache ses gestionnaires sur le HTML
    rendu côté serveur. On vérifie donc aussi l'état de l'image au montage.
  */
  const checkPortrait = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth === 0) setPortraitFailed(true);
  }, []);

  if (!portraitFailed) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element --
         repli silencieux si le fichier est absent : `next/image` renverrait une
         erreur d'exécution au lieu de déclencher `onError`. */
      <img
        ref={checkPortrait}
        src={JULIE_PORTRAIT_SRC}
        alt="Portrait du personnage Julie Dupont"
        className={cx("h-full w-full object-cover", className)}
        onError={() => setPortraitFailed(true)}
      />
    );
  }

  return <CharacterIllustration className={className} tone={tone} />;
}

/** Illustration de repli : silhouette abstraite, sans trait de visage. */
function CharacterIllustration({
  className,
  tone,
}: {
  className?: string;
  tone: "light" | "dark";
}) {
  const dark = tone === "dark";
  const backdropFrom = dark ? "#000c32" : "#e8f1fb";
  const backdropTo = dark ? "#001a64" : "#cfe2f7";
  const shape = dark ? "#213b86" : "#001a64";
  const shapeOpacity = dark ? 1 : 0.88;

  return (
    <svg
      viewBox="0 0 300 225"
      preserveAspectRatio="xMidYMid slice"
      className={cx("h-full w-full", className)}
      role="img"
      aria-label="Silhouette stylisée du personnage Julie Dupont"
    >
      <defs>
        <linearGradient id="julie-backdrop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={backdropFrom} />
          <stop offset="100%" stopColor={backdropTo} />
        </linearGradient>
      </defs>

      <rect width="300" height="225" fill="url(#julie-backdrop)" />

      {/* Halo derrière le personnage, pour détacher la silhouette du fond. */}
      <circle cx="150" cy="118" r="86" fill={shape} opacity={dark ? 0.18 : 0.08} />

      {/* Chevelure, tête et buste. */}
      <path
        d="M104 108c0-30 20-52 46-52s46 22 46 52c0 12-4 24-11 33l9 6c26 8 44 30 44 56v22H62v-22c0-26 18-48 44-56l9-6c-7-9-11-21-11-33z"
        fill={shape}
        opacity={shapeOpacity}
      />
      <path
        d="M104 104c0-28 21-48 46-48s46 20 46 48c0 6-6 4-12 0-14-9-34-12-54-8-14 3-22 12-26 12s0-2 0-4z"
        fill={shape}
        opacity={shapeOpacity}
      />
    </svg>
  );
}
