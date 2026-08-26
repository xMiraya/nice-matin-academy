import { cx } from "@/src/lib/format";

const SIZES = {
  xs: "h-7 w-7 text-[10px] rounded-xs",
  sm: "h-8 w-8 text-[11px] rounded-sm",
  md: "h-10 w-10 text-xs rounded-sm",
  lg: "h-12 w-12 text-sm rounded-md",
  xl: "h-16 w-16 text-lg rounded-lg",
} as const;

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
  size?: keyof typeof SIZES;
  /** Force une teinte neutre, par exemple sur un fond déjà coloré. */
  tone?: "auto" | "navy" | "outline";
  className?: string;
}

/** Pastille d'identité : initiales sur aplat, à la place d'une photographie. */
export function Avatar({ initials, size = "md", tone = "auto", className }: AvatarProps) {
  const surface =
    tone === "navy"
      ? "bg-brand text-white"
      : tone === "outline"
        ? "border border-white/25 bg-white/10 text-white"
        : tintFor(initials);

  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center justify-center font-semibold tracking-tight",
        SIZES[size],
        surface,
        className,
      )}
    >
      {initials}
    </span>
  );
}
