"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TranscriptLine } from "@/src/types";
import { cx } from "@/src/lib/format";

interface TranscriptViewerProps {
  lines: TranscriptLine[];
  characterName?: string;
  repName?: string;
  /** Le transcript est replié par défaut pour ne pas alourdir la page. */
  defaultOpen?: boolean;
  notice?: string;
}

/** Transcript sous forme de dialogue, repliable. */
export function TranscriptViewer({
  lines,
  characterName = "Julie Dupont",
  repName = "Commercial",
  defaultOpen = false,
  notice,
}: TranscriptViewerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 rounded-sm border border-line bg-mist/60 px-4 py-3 text-left transition-colors hover:bg-mist"
      >
        <span>
          <span className="block text-sm font-semibold text-ink">
            {open ? "Masquer le transcript" : "Afficher le transcript"}
          </span>
          <span className="mt-0.5 block text-xs text-graphite">
            {lines.length} répliques, extrait de l&apos;échange
          </span>
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={cx("shrink-0 text-graphite transition-transform", open && "rotate-180")}
        />
      </button>

      <div id={panelId} hidden={!open} className="pt-4">
        {notice ? (
          <p className="mb-4 rounded-sm border border-line bg-mist/60 px-4 py-3 text-sm leading-relaxed text-graphite">
            {notice}
          </p>
        ) : null}
        <ol className="space-y-3">
          {lines.map((line, index) => {
            const isRep = line.speaker === "commercial";
            return (
              <li
                key={index}
                className={cx(
                  "rounded-md border p-4",
                  isRep ? "border-line bg-white" : "border-brand/20 bg-brand-soft",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={cx(
                      "text-[11px] font-semibold uppercase tracking-[0.12em]",
                      isRep ? "text-graphite" : "text-brand-dark",
                    )}
                  >
                    {isRep ? repName : characterName}
                  </span>
                  {line.timestamp ? (
                    <span className="font-mono text-xs tabular-nums text-graphite">
                      {line.timestamp}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">{line.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
