import { cx } from "@/src/lib/format";

/**
 * Silhouette abstraite représentant le personnage virtuel.
 * Dessinée localement en SVG : aucune photographie externe n'est utilisée.
 */
export function CharacterAvatar({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const bg = tone === "dark" ? "#000c32" : "#ecf4fc";
  const shape = tone === "dark" ? "#213b86" : "#001a64";
  const shapeOpacity = tone === "dark" ? 1 : 0.85;

  return (
    <svg
      viewBox="0 0 200 200"
      className={cx("h-full w-full", className)}
      role="img"
      aria-label="Silhouette stylisée du personnage Julie Dupont"
    >
      <rect width="200" height="200" fill={bg} />
      <circle cx="100" cy="78" r="34" fill={shape} opacity={shapeOpacity} />
      <path
        d="M28 200c0-40.9 32.2-74 72-74s72 33.1 72 74z"
        fill={shape}
        opacity={shapeOpacity * 0.85}
      />
      <path d="M0 0h200v200H0z" fill="none" />
    </svg>
  );
}
