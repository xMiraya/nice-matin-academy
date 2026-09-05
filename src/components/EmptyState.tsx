import type { ReactNode } from "react";
import Image from "next/image";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  /** Photographie d'ambiance affichée à la place de la pastille d'icône. */
  image?: string;
  action?: ReactNode;
}

/**
 * État vide générique, utilisé quand aucune donnée n'est disponible.
 *
 * Une zone vide reste une zone vide : la photographie d'ambiance lui donne une
 * matière plutôt qu'un cadre pointillé nu, sans jamais faire croire qu'il y a
 * quelque chose à lire.
 */
export function EmptyState({ title, description, icon, image, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-mist/60 px-6 py-12 text-center">
      {image ? (
        <div className="relative mb-6 aspect-[3/2] w-full max-w-xs overflow-hidden rounded-md">
          <Image
            src={image}
            alt=""
            fill
            sizes="320px"
            className="pointer-events-none select-none object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-mist/70 to-transparent"
          />
        </div>
      ) : (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-white text-brand shadow-card">
          {icon ?? <Inbox size={20} aria-hidden />}
        </span>
      )}
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-graphite">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
