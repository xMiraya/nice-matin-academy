import type { ReactNode } from "react";
import { cx } from "@/src/lib/format";

interface PanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Retire le trait de séparation sous l'en-tête, pour les cartes graphiques. */
  flush?: boolean;
}

/** Carte blanche posée sur le canevas : en-tête discret, ombre très douce. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush = false,
}: PanelProps) {
  return (
    <section className={cx("nm-card flex flex-col", className)}>
      {title ? (
        <header
          className={cx(
            "flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6",
            flush ? "pb-1" : "border-b border-line pb-4",
          )}
        >
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-snug text-graphite">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cx("flex-1 p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Titre de section de page, hors carte. */
export function SectionTitle({
  children,
  description,
  action,
  className,
}: {
  children: ReactNode;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{children}</h2>
        {description ? <p className="mt-1 text-sm text-graphite">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
