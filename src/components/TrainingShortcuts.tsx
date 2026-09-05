import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const SHORTCUTS = [
  {
    href: "/commercial/fiches",
    image: "/images/vignettes/fiches.jpg",
    title: "Fiches méthodologiques",
    detail: "Les huit compétences, du premier contact à la conclusion.",
  },
  {
    href: "/commercial/qcm",
    image: "/images/vignettes/qcm.jpg",
    title: "Questions et évaluations",
    detail: "Vérifier ce qui est acquis, en quelques minutes.",
  },
  {
    href: "/commercial/nouvelle-simulation",
    image: "/images/vignettes/simulation.jpg",
    title: "Nouvelle simulation",
    detail: "Un entretien complet avec Julie, analysé ensuite par le Coach.",
  },
] as const;

/**
 * Trois portes d'entrée vers l'entraînement.
 *
 * Le tableau de bord répond à « où j'en suis » ; ce bloc répond à « et
 * maintenant, je fais quoi », en fin de page, une fois le diagnostic lu.
 */
export function TrainingShortcuts() {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {SHORTCUTS.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="nm-card-link group block h-full overflow-hidden">
            <span className="relative block aspect-[4/3] w-full overflow-hidden">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(min-width: 640px) 320px, 100vw"
                className="pointer-events-none select-none object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </span>
            <span className="block p-4 sm:p-5">
              <span className="flex items-center gap-1.5 text-base font-semibold text-ink">
                {item.title}
                <ArrowRight
                  size={15}
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-graphite">
                {item.detail}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
