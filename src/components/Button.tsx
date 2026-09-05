import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/src/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md";

/*
 * Boutons en aplats pleins.
 *
 * Aucune variante n'est en contour : chacune porte un fond opaque, et c'est
 * l'intensité de ce fond qui donne la hiérarchie. Un bouton bordé au fond
 * blanc se confondait avec les cartes et les champs de saisie, qui utilisent
 * la même recette ; un aplat, lui, ne ressemble à rien d'autre sur la page.
 *
 * Du plus fort au plus discret : marine plein, bleu ciel, gris. Le survol
 * fonce toujours d'un cran dans la même famille, de sorte que le changement
 * d'état se lise même sans percevoir finement la couleur.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-accent",
  secondary: "bg-brand-sky text-brand hover:bg-brand-accent hover:text-white",
  ghost: "bg-line text-ink hover:bg-line-strong",
  danger: "bg-danger text-white hover:bg-danger-bright",
  /** Pour les fonds marine, où le blanc devient la teinte la plus forte. */
  inverse: "bg-white text-brand hover:bg-brand-sky",
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
