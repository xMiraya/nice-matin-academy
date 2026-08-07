"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cx } from "@/src/lib/format";

export interface ProcessingStep {
  id: string;
  label: string;
  detail: string;
}

export type ProcessingStepStatus = "pending" | "active" | "done";

interface ProcessingStepsProps {
  steps: ProcessingStep[];
  /** Statut réel de chaque étape, fourni par l'appelant. */
  statuses: ProcessingStepStatus[];
  /** Message court décrivant l'état courant, affiché sous la barre. */
  statusMessage?: string;
}

const STATUS_LABELS: Record<ProcessingStepStatus, string> = {
  pending: "En attente",
  active: "En cours",
  done: "Terminé",
};

/**
 * Affichage de la progression de l'analyse.
 *
 * Ce composant est purement contrôlé : il n'invente aucune progression et
 * n'avance jamais de lui-même. Les statuts reflètent uniquement ce que le
 * serveur a réellement confirmé.
 */
export function ProcessingSteps({ steps, statuses, statusMessage }: ProcessingStepsProps) {
  const doneCount = statuses.filter((status) => status === "done").length;
  const progress = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="nm-label">Progression de l&apos;analyse</p>
        <p className="text-sm font-semibold tabular-nums text-ink">{progress} %</p>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de l'analyse"
      >
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {statusMessage ? (
        <p className="mt-3 text-sm leading-relaxed text-graphite" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => {
          const status = statuses[index] ?? "pending";
          return (
            <li
              key={step.id}
              className={cx(
                "flex items-start gap-3 rounded-md border px-4 py-3 transition-colors",
                status === "done"
                  ? "border-positive/25 bg-positive/5"
                  : status === "active"
                    ? "border-brand/30 bg-brand-soft"
                    : "border-line bg-white",
              )}
            >
              <span
                className={cx(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  status === "done"
                    ? "bg-positive text-white"
                    : status === "active"
                      ? "bg-brand text-white"
                      : "bg-mist text-graphite",
                )}
              >
                {status === "done" ? (
                  <Check size={13} aria-hidden />
                ) : status === "active" ? (
                  <Loader2 size={13} aria-hidden className="animate-spin" />
                ) : (
                  <span className="text-[11px] font-semibold tabular-nums">{index + 1}</span>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{step.label}</p>
                <p className="mt-0.5 text-sm leading-snug text-graphite">{step.detail}</p>
              </div>
              <span className="ml-auto shrink-0 self-center text-xs font-medium text-graphite">
                {STATUS_LABELS[status]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
