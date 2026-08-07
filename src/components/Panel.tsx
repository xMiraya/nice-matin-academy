import type { ReactNode } from "react";
import { cx } from "@/src/lib/format";

interface PanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Bloc structuré standard : en-tête discret, contenu net, bordure fine. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <section className={cx("flex flex-col rounded-md border border-line bg-white", className)}>
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-snug text-graphite">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cx("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Titre de section de page, hors carte. */
export function SectionTitle({
  children,
  description,
  action,
}: {
  children: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{children}</h2>
        {description ? <p className="mt-1 text-sm text-graphite">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
