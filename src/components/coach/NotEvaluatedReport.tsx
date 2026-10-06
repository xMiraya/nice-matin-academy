import { Info } from "lucide-react";
import type { CoachReport } from "@/src/types/coach";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { CoachTranscriptPanel } from "@/src/components/coach/CoachTranscriptPanel";
import {
  NON_EVALUABLE_MESSAGES,
  NON_EVALUABLE_REASON_LABELS,
  NON_EVALUABLE_TITLES,
  nonEvaluableReasonOf,
} from "@/src/lib/coach/evaluability";
import { formatDate, formatDuration } from "@/src/lib/format";

/**
 * Compte rendu d'une simulation non évaluée : on conserve la trace de la
 * tentative (date, durée, raison, dialogue) sans afficher la moindre note, ni
 * radar, jauge, point fort, axe d'amélioration, priorité ou mission.
 */
export function NotEvaluatedReport({
  report,
  variant,
}: {
  report: CoachReport;
  variant: "commercial" | "manager";
}) {
  const reason = nonEvaluableReasonOf(report) ?? "insufficient_usable_data";
  const isManager = variant === "manager";
  const backHref = isManager ? "/manager/simulations" : "/commercial/simulations";

  return (
    <>
      <PageHeader
        eyebrow={`${isManager ? "Compte rendu" : "Simulation"} : ${formatDate(report.session.date.slice(0, 10))}`}
        title={
          isManager
            ? `${NON_EVALUABLE_TITLES} · ${report.commercial.name}`
            : NON_EVALUABLE_TITLES
        }
        description={NON_EVALUABLE_MESSAGES[reason]}
        back={{ href: backHref, label: isManager ? "Simulations" : "Mes simulations" }}
        actions={
          isManager ? undefined : (
            <ButtonLink href="/commercial/nouvelle-simulation" variant="secondary">
              Nouvelle simulation
            </ButtonLink>
          )
        }
        meta={
          <>
            <Badge tone="vigilance">Non évaluée</Badge>
            <Badge>{formatDuration(report.session.durationSeconds)}</Badge>
          </>
        }
      />

      <div className="space-y-6">
        <Panel title="Ce qui s'est passé" description="Informations techniques conservées pour la traçabilité.">
          <div className="flex gap-3 rounded-md bg-mist/70 p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-graphite" aria-hidden />
            <p className="text-sm leading-relaxed text-graphite">
              {NON_EVALUABLE_REASON_LABELS[reason]}.{" "}
              {isManager
                ? "Cette tentative est conservée mais exclue des scores, de la progression, des statistiques d'équipe et de la mémoire du Coach."
                : "Aucune note n'est attribuée : cette simulation n'est comptée ni dans votre moyenne, ni dans votre progression."}
            </p>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
              <dt className="text-graphite">Date</dt>
              <dd className="font-medium text-ink">{formatDate(report.session.date.slice(0, 10))}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line/70 pb-2">
              <dt className="text-graphite">Durée</dt>
              <dd className="font-medium text-ink">{formatDuration(report.session.durationSeconds)}</dd>
            </div>
          </dl>
        </Panel>

        <CoachTranscriptPanel report={report} />
      </div>
    </>
  );
}
