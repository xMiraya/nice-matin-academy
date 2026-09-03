"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock, PencilLine, Search } from "lucide-react";
import type { IndexedQuestion } from "@/src/data/qcm/all-questions";
import type { Competency } from "@/src/types/qcm/competency";
import { Badge } from "@/src/components/StatusBadge";
import { useContentStatus } from "@/src/lib/content/use-effective-content";
import { cx } from "@/src/lib/format";

function QuestionRow({ item }: { item: IndexedQuestion }) {
  const status = useContentStatus("question", item.question.id);
  const editable = item.question.kind !== "ordering";

  const content = (
    <span className="flex items-center gap-4 rounded-md px-3 py-3">
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-sm font-medium text-ink">
          {item.question.prompt}
        </span>
        <span className="mt-1 block text-xs text-graphite">{item.source}</span>
      </span>
      {!editable ? (
        <Badge>
          <Lock size={11} aria-hidden />
          Réordonnancement
        </Badge>
      ) : status === "published" ? (
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
      {editable ? <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden /> : null}
    </span>
  );

  return editable ? (
    <Link
      href={`/manager/contenu/qcm/${item.question.id}`}
      className="block transition-colors hover:bg-mist"
    >
      {content}
    </Link>
  ) : (
    <span className="block cursor-not-allowed opacity-70">{content}</span>
  );
}

export function ContentQuestionList({
  items,
  competencies,
}: {
  items: IndexedQuestion[];
  competencies: readonly Competency[];
}) {
  const [query, setQuery] = useState("");
  const [competency, setCompetency] = useState<string>("toutes");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (competency !== "toutes" && item.question.competency !== competency) return false;
      if (!needle) return true;
      return item.question.prompt.toLowerCase().includes(needle);
    });
  }, [items, query, competency]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une question…"
            className="w-full rounded-sm border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink transition-colors placeholder:text-muted focus:border-brand-accent"
          />
        </label>
        <select
          value={competency}
          onChange={(event) => setCompetency(event.target.value)}
          className="rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-brand-accent"
        >
          <option value="toutes">Toutes les compétences</option>
          {competencies.map((item) => (
            <option key={item.id} value={item.id}>
              {item.shortLabel}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-2 text-xs text-muted">
        {filtered.length} question{filtered.length > 1 ? "s" : ""}
        {query || competency !== "toutes" ? ` sur ${items.length}` : ""}
      </p>

      <div className={cx("nm-card max-h-[560px] overflow-y-auto p-2", filtered.length === 0 && "p-0")}>
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-graphite">Aucune question ne correspond.</p>
        ) : (
          <ul className="divide-y divide-line/70">
            {filtered.map((item) => (
              <li key={item.question.id}>
                <QuestionRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
