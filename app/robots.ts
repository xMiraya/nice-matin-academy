import type { MetadataRoute } from "next";

/**
 * Prototype interne Nice-Matin : aucune indexation publique.
 * Complété par l'en-tête `X-Robots-Tag` défini dans `next.config.ts`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
