"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cx } from "@/src/lib/format";

/**
 * Mascotte du Coach IA Nice-Matin.
 *
 * L'image est affichée en `object-contain` dans un cadre carré : le visage
 * n'est jamais recadré ni déformé, quelle que soit la taille demandée.
 * Si le fichier est absent, un repli neutre conserve la mise en page.
 */

const MASCOT_SRC = "/images/coach-nice-matin.png";
const MASCOT_ALT = "Coach IA Nice-Matin";

export type CoachMascotSize = "sm" | "md" | "lg";
export type CoachMascotVariant = "default" | "analysis" | "advice";

/** Côté du cadre carré, en pixels. */
const SIZES: Record<CoachMascotSize, number> = {
  sm: 40,
  md: 80,
  lg: 128,
};

interface CoachMascotProps {
  size?: CoachMascotSize;
  variant?: CoachMascotVariant;
  /** Message court affiché à côté de la mascotte (variante « advice »). */
  message?: string;
  /** Apparition progressive et léger mouvement vertical. */
  animated?: boolean;
  className?: string;
}

export function CoachMascot({
  size = "md",
  variant = "default",
  message,
  animated = false,
  className,
}: CoachMascotProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const reduceMotion = useReducedMotion();

  const px = SIZES[size];
  const shouldAnimate = animated && !reduceMotion;

  const frame = (
    <span
      className={cx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-brand-soft",
        variant === "analysis" ? "border-brand/30" : "border-line",
      )}
      style={{ width: px, height: px }}
    >
      {/* Repli en arrière-plan, révélé seulement si l'image ne se charge pas. */}
      {imageFailed ? (
        <Sparkles
          size={Math.round(px * 0.4)}
          className="absolute inset-0 m-auto text-brand"
          aria-hidden
        />
      ) : null}

      {/*
        L'image n'est jamais démontée : elle est simplement masquée en cas
        d'échec. Un chargement réussi ultérieur (fichier ajouté, cache
        rafraîchi) rétablit donc la mascotte de lui-même, sans état bloqué.
      */}
      <Image
        src={MASCOT_SRC}
        alt={MASCOT_ALT}
        width={px}
        height={px}
        sizes={`${px}px`}
        className={cx(
          "relative h-full w-full object-contain transition-opacity duration-200",
          imageFailed && "opacity-0",
        )}
        onLoad={() => setImageFailed(false)}
        onError={() => setImageFailed(true)}
        priority={size === "lg"}
      />
    </span>
  );

  const avatar = shouldAnimate ? (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {/* Oscillation de quatre pixels, lente et discrète. */}
      <motion.span
        className="inline-block"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {frame}
      </motion.span>
    </motion.span>
  ) : (
    frame
  );

  if (!message) {
    return className ? <span className={className}>{avatar}</span> : avatar;
  }

  return (
    <div className={cx("flex items-start gap-4", className)}>
      {avatar}
      <div className="min-w-0 flex-1 rounded-md border border-line bg-mist/50 px-4 py-3">
        <p className="nm-label">Coach IA</p>
        <p className="mt-1 text-sm leading-relaxed text-ink">{message}</p>
      </div>
    </div>
  );
}
