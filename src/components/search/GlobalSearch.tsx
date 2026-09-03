"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  commercialSearchIndex,
  filterSearchIndex,
  managerSearchIndex,
} from "@/src/lib/search/build-index";
import type { WorkspaceRole } from "@/src/components/navigation";
import { cx } from "@/src/lib/format";

/**
 * Recherche instantanée sur l'espace courant.
 *
 * Remplaçait un champ purement visuel, marqué « démonstration, non
 * connectée » : celui-ci filtre réellement les pages, les commerciaux, les
 * compétences et les simulations, et navigue au clic ou à l'entrée.
 */
export function GlobalSearch({ role }: { role: WorkspaceRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(
    () => (role === "manager" ? managerSearchIndex() : commercialSearchIndex()),
    [role],
  );
  const results = useMemo(() => filterSearchIndex(index, query), [index, query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index_) => (index_ + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index_) => (index_ - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[activeIndex].href);
    }
  }

  return (
    <div ref={containerRef} className="relative hidden xl:block">
      <div className="flex items-center gap-2.5 rounded-sm border border-line bg-white py-2 pl-3 pr-2.5 text-sm text-muted transition-colors focus-within:border-brand-accent hover:border-line-strong">
        <Search size={15} aria-hidden className="shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            // Réinitialisé ici plutôt que dans un effet : la sélection au
            // clavier ne doit pas rester bloquée sur un résultat qui a
            // disparu du nouveau filtrage.
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Rechercher…"
          aria-label="Recherche"
          className="w-40 bg-transparent text-left text-graphite outline-none placeholder:text-muted"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Effacer la recherche"
            className="shrink-0 text-muted hover:text-graphite"
          >
            <X size={13} aria-hidden />
          </button>
        ) : (
          <kbd className="shrink-0 rounded-xs border border-line bg-mist px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted">
            ⌘K
          </kbd>
        )}
      </div>

      {open && query ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-line bg-white shadow-lift">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-graphite">
              Aucun résultat pour « {query} ».
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1.5">
              {results.map((item, itemIndex) => (
                <li key={`${item.group}-${item.label}-${itemIndex}`}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    className={cx(
                      "flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors",
                      itemIndex === activeIndex ? "bg-brand-soft" : "hover:bg-mist",
                    )}
                  >
                    <span className="nm-label text-[10px] text-brand-mid">{item.group}</span>
                    <span className="text-sm font-semibold text-ink">{item.label}</span>
                    {item.description ? (
                      <span className="line-clamp-1 text-xs text-graphite">{item.description}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
