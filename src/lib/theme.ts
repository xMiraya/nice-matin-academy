/**
 * Valeurs de la direction artistique exposées au JavaScript.
 *
 * Les graphiques Recharts et les SVG dessinés à la main ne peuvent pas lire les
 * jetons Tailwind : ce fichier est la source unique des couleurs utilisées en
 * dehors des classes utilitaires. Les valeurs reprennent la charte publique de
 * Nice-Matin.
 */
export const NM = {
  navy: "#001a64",
  navyDeep: "#000c32",
  blue: "#0a4aab",
  blueMid: "#213b86",
  sky: "#cbe4fe",
  skySoft: "#ecf4fc",
  ink: "#000d32",
  graphite: "#59617a",
  muted: "#6b7290",
  line: "#e4e8f1",
  lineSoft: "#eff2f8",
  canvas: "#eff2f8",
  green: "#10b981",
  amber: "#fac043",
  amberDeep: "#e0940b",
  orange: "#ef9350",
  red: "#e30613",
} as const;

/** Style commun des infobulles Recharts. */
export const CHART_TOOLTIP = {
  borderRadius: 12,
  border: "1px solid #e4e8f1",
  fontSize: 12,
  padding: "8px 12px",
  boxShadow: "0 14px 30px -18px rgb(0 13 50 / 0.35)",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
} as const;

/** Graduations d'axes. */
export const CHART_AXIS_TICK = { fill: NM.muted, fontSize: 11 } as const;

/** Trame de fond horizontale. */
export const CHART_GRID = NM.lineSoft;
