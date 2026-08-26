import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { cx } from "@/src/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-card hover:bg-brand-accent",
  secondary: "border border-line bg-white text-ink shadow-card hover:border-line-strong hover:bg-mist",
  ghost: "text-graphite hover:bg-mist hover:text-ink",
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
