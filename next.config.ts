import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Racine Turbopack calculée depuis l'emplacement de ce fichier :
// évite l'avertissement « inferred workspace root » sans chemin absolu codé en dur.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Domaines strictement nécessaires à la visioconférence Tavus.
 *
 * En mode « call object », `@daily-co/daily-js` charge une machine d'appel
 * masquée depuis `c.daily.co` : `frame-src` reste donc requis, même sans
 * interface Daily Prebuilt. Les médias transitent par l'infrastructure Daily
 * (`*.daily.co`, `*.pluot.blue`) en HTTPS et WebSocket.
 */
const TAVUS_FRAME_ORIGINS = ["https://*.daily.co"];
const TAVUS_CONNECT_ORIGINS = [
  "https://*.daily.co",
  "https://*.tavus.io",
  "https://tavusapi.com",
  "https://*.pluot.blue",
  "wss://*.daily.co",
  "wss://*.pluot.blue",
];

/**
 * En-têtes de sécurité.
 *
 * `frame-src` et `connect-src` n'ouvrent que les origines Tavus/Daily réellement
 * utilisées : la politique n'est jamais élargie à l'ensemble des domaines.
 * `Permissions-Policy` délègue explicitement la caméra et le microphone à
 * l'iframe Daily, sans quoi l'attribut `allow` de l'iframe resterait sans effet.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injecte des scripts et styles en ligne en production.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      // Daily instancie ses décodeurs média dans des workers issus de blobs.
      "worker-src 'self' blob:",
      `frame-src 'self' ${TAVUS_FRAME_ORIGINS.join(" ")}`,
      `connect-src 'self' ${TAVUS_CONNECT_ORIGINS.join(" ")}`,
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "Permissions-Policy",
    value: [
      // La capture caméra/micro a lieu dans la machine d'appel Daily (`c.daily.co`),
      // pas dans notre document : la délégation doit la nommer explicitement.
      'camera=(self "https://c.daily.co" "https://tavus.daily.co")',
      'microphone=(self "https://c.daily.co" "https://tavus.daily.co")',
      'display-capture=(self "https://c.daily.co" "https://tavus.daily.co")',
      'fullscreen=(self "https://c.daily.co")',
      "geolocation=()",
      "payment=()",
    ].join(", "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Prototype interne : aucune indexation publique.
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
