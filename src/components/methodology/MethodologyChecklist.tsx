"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { cx } from "@/src/lib/format";

/**
 * Checklist cochable en local : aucune persistance, aucun stockage.
 * Cases natives, donc navigation clavier et lecteurs d'écran pris en charge.
 */
export function MethodologyChecklist({ items }: { items: readonly string[] }) {
  const baseId = useId();
  const [checked, setChecked] = useState<readonly boolean[]>(() => items.map(() => false));
  const done = checked.filter(Boolean).length;

  return (
    <div>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const id = `${baseId}-${index}`;
          const isChecked = checked[index] ?? false;
          return (
            <li key={item}>
              <label
                htmlFor={id}
                className={cx(
                  "flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border px-3 py-2.5 text-sm leading-relaxed transition-colors",
                  isChecked
                    ? "border-positive-bright/30 bg-positive-soft text-graphite"
                    : "border-line bg-mist/60 text-ink hover:border-line-strong",
                )}
              >
                <input
                  type="checkbox"
                  id={id}
                  checked={isChecked}
                  onChange={() =>
                    setChecked((current) =>
                      current.map((value, i) => (i === index ? !value : value)),
                    )
                  }
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cx(
                    "mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                    isChecked
                      ? "border-positive-bright bg-positive-bright text-white"
                      : "border-line-strong bg-white",
                  )}
                >
                  {isChecked ? <Check size={12} strokeWidth={3} /> : null}
                </span>
                <span className={isChecked ? "line-through decoration-positive/40" : undefined}>
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13px] text-muted" aria-live="polite">
        {done} point{done > 1 ? "s" : ""} sur {items.length} vérifié{done > 1 ? "s" : ""}.
      </p>
    </div>
  );
}
