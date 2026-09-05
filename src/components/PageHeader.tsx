import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cx } from "@/src/lib/format";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}

/** En-tête de page : fil de retour, titre éditorial, actions à droite. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  back,
  className,
}: PageHeaderProps) {
  return (
    <div className={cx("mb-6", className)}>
      {back ? (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-white py-1.5 pl-2 pr-3.5 text-[13px] font-medium text-graphite transition-colors hover:border-brand-sky hover:text-brand"
        >
          <ChevronLeft size={15} aria-hidden />
          {back.label}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="nm-label mb-2.5">{eyebrow}</p> : null}
          <h1 className="nm-display text-[1.75rem] leading-[1.15] text-ink sm:text-[2.125rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-graphite sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
        {/*
          Pas de `shrink-0` : sur mobile, deux actions côte à côte dépassent la
          largeur d'écran. Le bloc prend toute la ligne et les boutons passent
          l'un sous l'autre.
        */}
        {actions ? (
          <div className="flex w-full flex-wrap gap-2.5 sm:w-auto sm:justify-end">{actions}</div>
        ) : null}
      </div>

      {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
    </div>
  );
}
