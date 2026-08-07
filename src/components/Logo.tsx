import { cx } from "@/src/lib/format";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** « dark » pour un affichage sur fond noir éditorial. */
  tone?: "light" | "dark";
  className?: string;
}

const SIZES = {
  sm: { main: "text-sm", sub: "text-[10px]", bar: "h-5 w-[3px]" },
  md: { main: "text-lg", sub: "text-[11px]", bar: "h-7 w-1" },
  lg: { main: "text-2xl sm:text-3xl", sub: "text-sm", bar: "h-10 w-1.5" },
} as const;

/**
 * Logo typographique provisoire de la plateforme.
 * Le logo officiel Nice-Matin n'est volontairement pas utilisé à ce stade.
 */
export function Logo({ size = "md", tone = "light", className }: LogoProps) {
  const s = SIZES[size];
  return (
    <span className={cx("flex items-center gap-3", className)}>
      <span aria-hidden className={cx("shrink-0 rounded-sm bg-brand", s.bar)} />
      <span className="flex flex-col leading-none">
        <span
          className={cx(
            "font-semibold uppercase tracking-[0.16em]",
            tone === "dark" ? "text-white" : "text-ink",
            s.main,
          )}
        >
          Nice-Matin
        </span>
        <span
          className={cx(
            "mt-1 font-semibold uppercase tracking-[0.34em] text-brand",
            s.sub,
          )}
        >
          Academy
        </span>
      </span>
    </span>
  );
}
