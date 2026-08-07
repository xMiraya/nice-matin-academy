import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
}

/** En-tête de page : fil de retour, titre fort, actions à droite. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  back,
}: PageHeaderProps) {
  return (
    <div className="mb-7">
      {back ? (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-graphite transition-colors hover:text-ink"
        >
          <ChevronLeft size={16} aria-hidden />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="nm-label mb-2">{eyebrow}</p> : null}
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-graphite sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
      </div>

      {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
    </div>
  );
}
