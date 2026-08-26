import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/** État vide générique, utilisé quand aucune donnée n'est disponible. */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-mist/60 px-6 py-12 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-white text-brand shadow-card">
        {icon ?? <Inbox size={20} aria-hidden />}
      </span>
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-graphite">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
