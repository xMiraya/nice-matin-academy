import Link from "next/link";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { qcmRoutes } from "@/src/data/qcm/routes";

/** Progression visuelle des cinq niveaux d'évaluation. */
export function LevelLadder({ compact = false }: { readonly compact?: boolean }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ASSESSMENTS.map((assessment) => (
        <li key={assessment.id} className="flex">
          <Link
            href={qcmRoutes.assessmentFor(assessment.level)}
            className="group flex h-full min-h-11 w-full flex-col gap-1 rounded-sm border border-line bg-white p-4 transition-colors hover:border-brand-accent hover:bg-brand-soft"
          >
            <span className="nm-label">Niveau {assessment.level}</span>
            <span className="text-sm font-semibold text-ink group-hover:text-brand">
              {assessment.title}
            </span>
            {compact ? null : (
              <span className="mt-1 text-xs text-muted">
                {assessment.questions.length} questions · {assessment.levelLabel}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}
