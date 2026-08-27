import { ChevronDown, CircleAlert, ListChecks, Target } from "lucide-react";
import type { Competency } from "@/src/types/qcm/competency";

const COLUMNS = [
  {
    key: "objectives",
    title: "Objectifs",
    icon: Target,
    accent: "border-brand-sky bg-brand-soft",
    dot: "bg-brand",
    text: "text-brand",
  },
  {
    key: "expectedBehaviours",
    title: "Comportements attendus",
    icon: ListChecks,
    accent: "border-positive-bright/30 bg-positive-soft",
    dot: "bg-positive-bright",
    text: "text-positive",
  },
  {
    key: "commonMistakes",
    title: "Erreurs fréquentes",
    icon: CircleAlert,
    accent: "border-danger-bright/25 bg-danger-soft",
    dot: "bg-danger-bright",
    text: "text-danger",
  },
] as const satisfies readonly {
  key: keyof Pick<Competency, "objectives" | "expectedBehaviours" | "commonMistakes">;
  title: string;
  icon: typeof Target;
  accent: string;
  dot: string;
  text: string;
}[];

/**
 * Rappel de la compétence, replié par défaut.
 *
 * Le commercial vient d'abord s'entraîner : la théorie reste accessible en un
 * clic sans occuper l'écran. `<details>` évite tout JavaScript et reste
 * utilisable au clavier et par les lecteurs d'écran.
 */
export function CompetencyBriefing({ competency }: { competency: Competency }) {
  const total =
    competency.objectives.length +
    competency.expectedBehaviours.length +
    competency.commonMistakes.length;

  return (
    <details className="nm-card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-mist sm:px-6">
        <span className="min-w-0">
          <span className="nm-label">Rappel de la compétence</span>
          <span className="mt-1 block text-sm font-semibold text-ink">
            Objectifs, comportements attendus et erreurs fréquentes
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="hidden rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-graphite sm:inline">
            {total} repères
          </span>
          <ChevronDown
            size={18}
            aria-hidden
            className="text-muted transition-transform group-open:rotate-180"
          />
        </span>
      </summary>

      <div className="border-t border-line px-5 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => {
            const Icon = column.icon;
            return (
              <section key={column.key} className={`rounded-md border p-4 ${column.accent}`}>
                <h3 className={`flex items-center gap-2 text-sm font-semibold ${column.text}`}>
                  <Icon size={15} aria-hidden />
                  {column.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {competency[column.key].map((item) => (
                    <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink/85">
                      <span
                        aria-hidden
                        className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${column.dot}`}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">Source : {competency.source}</p>
      </div>
    </details>
  );
}
