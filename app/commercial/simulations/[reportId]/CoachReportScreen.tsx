"use client";

import { FileSearch, Target } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";
import { ButtonLink } from "@/src/components/Button";
import { useIsHydrated, useReport } from "@/src/lib/reports/use-reports";
import { CoachMascot } from "@/src/components/coach/CoachMascot";
import {
  CoachCompetencyDetail,
  CoachDisclaimer,
  CoachHighlightsPanel,
  CoachKeyMomentsPanel,
  CoachLimitationsPanel,
  CoachMissedOpportunitiesPanel,
  CoachPsychologicalPanel,
  CoachRadarPanel,
  CoachScorePanel,
} from "@/src/components/coach/CoachShared";
import { formatDate, formatDuration } from "@/src/lib/format";

/** Compte rendu réel produit par le Coach IA, vue commercial. */
export function CoachReportScreen({ reportId }: { reportId: string }) {
  const report = useReport(reportId);
  const hydrated = useIsHydrated();

  if (!hydrated) {
    return (
      <div className="py-16 text-center text-sm text-graphite">Chargement du compte rendu…</div>
    );
  }

  if (!report) {
    return (
      <>
        <PageHeader
          eyebrow="Espace commercial"
          title="Compte rendu introuvable"
          back={{ href: "/commercial/simulations", label: "Mes simulations" }}
        />
        <EmptyState
          icon={<FileSearch size={20} aria-hidden />}
          title="Ce compte rendu n'est pas disponible sur cet appareil"
          description="Les analyses de ce prototype sont enregistrées localement dans le navigateur. Elles ne sont pas partagées entre appareils ni entre navigateurs."
          action={
            <ButtonLink href="/commercial/nouvelle-simulation" variant="secondary">
              Lancer une nouvelle simulation
            </ButtonLink>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Compte rendu — ${formatDate(report.session.date.slice(0, 10))}`}
        title="Votre entretien avec Julie Dupont"
        description={report.commercialSummary}
        back={{ href: "/commercial/simulations", label: "Mes simulations" }}
        actions={
          <ButtonLink href="/commercial/nouvelle-simulation" variant="secondary">
            Nouvelle simulation
          </ButtonLink>
        }
        meta={
          <>
            <Badge tone="marque">Analyse du Coach IA</Badge>
            <Badge>{formatDuration(report.session.durationSeconds)}</Badge>
            {report.session.selectedObjectiveLabels.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
          </>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <CoachScorePanel report={report} className="lg:col-span-2" />
          <CoachRadarPanel report={report} className="lg:col-span-3" />
        </div>

        {/* Priorité pédagogique mise en avant, portée par le Coach */}
        <Panel title="Votre priorité" description="La compétence à travailler en premier.">
          <div className="flex flex-wrap items-start gap-5 sm:flex-nowrap">
            <CoachMascot size="md" variant="advice" />

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-base font-semibold text-ink">
                <Target size={17} className="shrink-0 text-brand" aria-hidden />
                {report.pedagogicalPriority.label}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                {report.pedagogicalPriority.reason}
              </p>

              {/* Conseil principal, volontairement très court */}
              <p className="mt-3 rounded-md border border-brand/25 bg-brand-soft px-4 py-3 text-sm font-medium leading-relaxed text-ink">
                {report.nextActions[0]?.title ?? "Poursuivez l'entraînement sur cette compétence."}
              </p>

              <a
                href="#conseils"
                className="mt-4 inline-flex items-center gap-2 rounded-sm bg-ink px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-graphite"
              >
                Voir les conseils
              </a>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-3">
            {report.nextActions.map((action, index) => (
              <div key={`${action.title}-${index}`} className="rounded-md border border-line p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-ink text-xs font-semibold tabular-nums text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold leading-snug text-ink">{action.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                  {action.instruction}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div id="conseils" className="grid scroll-mt-24 grid-cols-1 gap-6 lg:grid-cols-2">
          <CoachHighlightsPanel
            title="Points forts"
            description="Ce qui a fonctionné pendant l'échange."
            highlights={report.strengths}
            tone="positif"
          />
          <CoachHighlightsPanel
            title="Axes d'amélioration"
            description="Ce qui mérite d'être retravaillé."
            highlights={report.improvements}
            tone="vigilance"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <CoachKeyMomentsPanel moments={report.keyMoments} className="lg:col-span-3" />
          <CoachPsychologicalPanel report={report} className="lg:col-span-2" />
        </div>

        <CoachCompetencyDetail report={report} />

        <CoachMissedOpportunitiesPanel opportunities={report.missedOpportunities} />

        <CoachLimitationsPanel report={report} />

        <CoachDisclaimer variant="commercial" />
      </div>
    </>
  );
}
