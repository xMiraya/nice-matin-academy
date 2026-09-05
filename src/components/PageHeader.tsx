import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { cx } from "@/src/lib/format";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
  /**
   * Photographie de fond. L'en-tête bascule alors en carte marine, texte en
   * blanc sur un voile assez dense pour que rien ne devienne illisible.
   */
  image?: string;
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
  image,
  className,
}: PageHeaderProps) {
  const inner = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className={cx("nm-label mb-2.5", image && "text-white/60")}>{eyebrow}</p>
          ) : null}
          <h1
            className={cx(
              "nm-display text-[1.75rem] leading-[1.15] sm:text-[2.125rem]",
              image ? "text-white" : "text-ink",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cx(
                "mt-2.5 max-w-2xl text-sm leading-relaxed sm:text-[15px]",
                image ? "text-brand-sky" : "text-graphite",
              )}
            >
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
    </>
  );

  return (
    <div className={cx("mb-6", className)}>
      {back ? (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-line py-1.5 pl-2 pr-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-brand-sky hover:text-brand"
        >
          <ChevronLeft size={15} aria-hidden />
          {back.label}
        </Link>
      ) : null}

      {image ? (
        <div className="nm-card nm-navy relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 960px, 100vw"
            className="pointer-events-none select-none object-cover object-right"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-brand-dark/60"
          />
          <div className="relative">{inner}</div>
        </div>
      ) : (
        inner
      )}
    </div>
  );
}
