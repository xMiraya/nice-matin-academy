"use client";

import { Plus, Trash2 } from "lucide-react";

interface EditableListProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

/** Liste de textes courts, éditable ligne par ligne : ajout, suppression, correction. */
export function EditableList({ label, items, onChange, placeholder }: EditableListProps) {
  function update(index: number, value: string) {
    const next = [...items];
    next[index] = value;
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function add() {
    onChange([...items, ""]);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{label}</p>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(event) => update(index, event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted focus:border-brand-accent"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Supprimer cette ligne"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-accent"
      >
        <Plus size={15} aria-hidden />
        Ajouter une ligne
      </button>
    </div>
  );
}
