"use client";

import { useState } from "react";
import Image from "next/image";
import { cx } from "@/src/lib/format";

const SIZES = {
  xs: "h-7 w-7 text-[10px] rounded-xs",
  sm: "h-8 w-8 text-[11px] rounded-sm",
  md: "h-10 w-10 text-xs rounded-sm",
  lg: "h-12 w-12 text-sm rounded-md",
  xl: "h-16 w-16 text-lg rounded-lg",
} as const;

/** Côté rendu en pixels, pour que Next serve une image à la bonne taille. */
const PIXELS = { xs: 28, sm: 32, md: 40, lg: 48, xl: 64 } as const;

/**
 * Palette d'aplats dérivée de la charte : la teinte reste stable pour une même
 * personne, ce qui aide à la reconnaître d'un écran à l'autre.
 */
const TINTS = [
  "bg-brand text-white",
  "bg-brand-accent text-white",
  "bg-brand-mid text-white",
  "bg-brand-sky text-brand",
  "bg-brand-dark text-white",
] as const;

function tintFor(seed: string): string {
  let sum = 0;
  for (let index = 0; index < seed.length; index += 1) {
    sum += seed.charCodeAt(index);
  }
  return TINTS[sum % TINTS.length];
}

interface AvatarProps {
  initials: string;
  /** Photographie du profil. Les initiales restent le repli. */
  photo?: string;
  size?: keyof typeof SIZES;
  /** Force une teinte neutre, par exemple sur un fond déjà coloré. */
  tone?: "auto" | "navy" | "outline";
  className?: string;
}

/**
 * Pastille d'identité.
 *
 * Une photographie quand le profil en a une, les initiales sur aplat sinon.
 * Le repli couvre aussi le cas d'un fichier absent ou illisible : plutôt que
 * l'icône d'image cassée du navigateur, on retombe sur la pastille colorée.
 */
export function Avatar({ initials, photo, size = "md", tone = "auto", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  const surface =
    tone === "navy"
      ? "bg-brand text-white"
      : tone === "outline"
        ? "border border-white/25 bg-white/10 text-white"
        : tintFor(initials);

  const shell = cx(
    "flex shrink-0 items-center justify-center overflow-hidden font-semibold tracking-tight",
    SIZES[size],
    className,
  );

  if (photo && !failed) {
    const side = PIXELS[size];
    return (
      <span aria-hidden className={cx(shell, "bg-mist")}>
        <Image
          src={photo}
          alt=""
          width={side}
          height={side}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span aria-hidden className={cx(shell, surface)}>
      {initials}
    </span>
  );
}
