import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/src/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md";

/*
 * Hiérarchie visuelle des boutons.
 *
 * Avant cette révision, `secondary` (fond blanc + bordure fine + ombre douce)
 * était visuellement identique aux cartes non cliquables (`nm-card` utilise
 * exactly la même recette). Un bouton secondaire posé à côté d'un panneau
 * ordinaire ne se distinguait donc que par son contenu, jamais par sa forme —
 * on ne pouvait pas deviner au premier coup d'œil ce qui réagissait au clic.
 *
 * Chaque variante porte maintenant une couleur de marque bien à elle, visible
 * même sans lire le texte : bordure teintée + fond légèrement teinté pour le
 * secondaire, puce visible pour le fantôme. Le survol accentue toujours la
 * teinte plutôt que de simplement foncer un gris neutre.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-card hover:bg-brand-accent",
  secondary:
    "border-[1.5px] border-brand-sky bg-brand-soft text-brand transition-shadow hover:border-brand-accent hover:bg-white hover:shadow-card",
  ghost:
    "border border-transparent bg-mist text-graphite hover:border-line-strong hover:bg-white hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-bright",
  inverse: "bg-white text-brand shadow-card hover:bg-brand-sky",
};

const SIZES: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-4.5 py-2.5 text-sm",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

interface ButtonLinkProps extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

/** Bouton de navigation réelle entre les pages. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cx(BASE, SIZES[size], VARIANTS[variant], className)} {...props}>
      {children}
    </Link>
  );
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

/** Bouton d'action locale (ouverture, bascule, démonstration). */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(BASE, SIZES[size], VARIANTS[variant], className)}
      {...props}
    />
  );
}
