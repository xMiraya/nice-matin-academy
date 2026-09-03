"use client";

import Link from "next/link";
import { ChevronRight, PencilLine } from "lucide-react";
import type { MethodologySheet } from "@/src/types/methodology";
import { Badge } from "@/src/components/StatusBadge";
import { useContentStatus } from "@/src/lib/content/use-effective-content";

function StatusRow({ sheet }: { sheet: MethodologySheet }) {
  const status = useContentStatus("sheet", sheet.slug);
  return (
    <Link
      href={`/manager/contenu/fiches/${sheet.slug}`}
      className="flex items-center gap-4 rounded-md px-3 py-3 transition-colors hover:bg-mist"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs bg-brand text-xs font-semibold tabular-nums text-white">
        {sheet.number}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{sheet.title}</span>
        <span className="block truncate text-xs text-graphite">{sheet.objective}</span>
      </span>
      {status === "published" ? (
        <Badge tone="positif" dot>
          Publié modifié
        </Badge>
      ) : status === "draft" ? (
        <Badge tone="vigilance">
          <PencilLine size={11} aria-hidden />
          Brouillon
        </Badge>
      ) : (
        <Badge>Contenu d&apos;origine</Badge>
      )}
      <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
    </Link>
  );
}

export function ContentSheetList({ sheets }: { sheets: readonly MethodologySheet[] }) {
  return (
    <div className="nm-card p-2">
      <ul className="divide-y divide-line/70">
        {sheets.map((sheet) => (
          <li key={sheet.slug}>
            <StatusRow sheet={sheet} />
          </li>
        ))}
      </ul>
    </div>
  );
}
