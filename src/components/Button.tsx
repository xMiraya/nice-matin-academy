import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/src/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-line bg-white text-ink hover:bg-mist",
  ghost: "text-graphite hover:bg-mist hover:text-ink",
  danger: "bg-danger text-white hover:bg-[#b92c3c]",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

interface ButtonLinkProps extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

/** Bouton de navigation réelle entre les pages. */
export function ButtonLink({ variant = "primary", className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={cx(BASE, VARIANTS[variant], className)} {...props}>
      {children}
    </Link>
  );
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
}

/** Bouton d'action locale (ouverture, bascule, démonstration). */
export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cx(BASE, VARIANTS[variant], className)} {...props} />;
}
