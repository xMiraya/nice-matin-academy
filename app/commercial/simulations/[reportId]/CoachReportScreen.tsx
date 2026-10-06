"use client";

import { ArrowRight, FileSearch, Lightbulb, Target } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";
import { MetricCard } from "@/src/components/MetricCard";
import { ButtonLink } from "@/src/components/Button";
import { useIsHydrated, useReport } from "@/src/lib/reports/use-reports";
import { NotEvaluatedReport } from "@/src/components/coach/NotEvaluatedReport";
import { isEvaluatedReport } from "@/src/lib/coach/evaluability";
import { CoachMascot } from "@/src/components/coach/CoachMascot";
import { CoachTranscriptPanel } from "@/src/components/coach/CoachTranscriptPanel";
import { ReportCommentThread } from "@/src/components/coach/ReportCommentThread";
import {
  CoachCompetencyDetail,
  CoachDisclaimer,
  CoachHighlightsPanel,
  CoachKeyMomentsPanel,
  CoachLimitationsPanel,
  CoachMissedOpportunitiesPanel,
  CoachNextMissionCard,
  CoachProgressionPanel,
  CoachPsychologicalPanel,
  CoachRadarPanel,
  CoachScorePanel,
  OUTCOME_LABELS,
} from "@/src/components/coach/CoachShared";
import { DIFFICULTY_LABELS, formatDate, formatDuration } from "@/src/lib/format";

/** Compte rendu réel produit par le Coach IA, vue commercial. */
export function CoachReportScreen({ reportId }: { reportId: string }) {
  const report = useReport(reportId);
  const hydrated = useIsHydrated();

  if (!hydrated) {
    return (
      <div className="py-16 text-center text-sm text-graphite">Chargement du compte rendu…</div>
    );
  }

  const observed = report ? report.competencies.filter((c) => c.evidence.length > 0).length : 0;

  if (!report) {
    return (
      <>
        <PageHeader
          eyebrow="Espace commercial"
          title="Compte rendu introuvable"
          back={{ href: "/commercial/simulations", label: "Mes simulations" }}
        />
        <EmptyState
          image="/images/etats/aucun-resultat.jpg"
          icon={<FileSearch size={20} aria-hidden />}
          title="Ce compte rendu est introuvable"
          description="Il a peut-être été supprimé, ou le lien est incorrect. Retrouvez toutes vos simulations dans l'historique."
          action={
            <ButtonLink href="/commercial/nouvelle-simulation" variant="secondary">
              Lancer une nouvelle simulation
            </ButtonLink>
          }
        />
      </>
    );
  }

  if (!isEvaluatedReport(report)) return <NotEvaluatedReport report={report} variant="commercial" />;

  return (
    <>
      <PageHeader
        eyebrow={`Compte rendu : ${formatDate(report.session.date.slice(0, 10))}`}
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
            {report.session.difficulty ? (
              <Badge>Niveau {DIFFICULTY_LABELS[report.session.difficulty].toLowerCase()}</Badge>
            ) : null}
            {report.session.selectedObjectiveLabels.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
          </>
        }
      />

      <div className="space-y-6">
        {/* Chiffres clés : la forme du compte rendu se lit sans lire le texte. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            tone="neutre"
            label="Durée"
            value={formatDuration(report.session.durationSeconds)}
            hint={OUTCOME_LABELS[report.session.outcome]}
          />
          <MetricCard
            tone="ciel"
            label="Compétences observées"
            value={`${observed} / ${report.competencies.length}`}
            hint="notées à partir d’extraits réels"
          />
          <MetricCard
            tone="positif"
            label="Points forts"
            value={report.strengths.length}
            hint="relevés par le Coach IA"
          />
          <MetricCard
            tone="vigilance"
            label="Axes d’amélioration"
            value={report.improvements.length}
            hint="à travailler en priorité"
          />
        </div>

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

              {/*
                Conseil principal. Présenté comme une citation et non comme un
                encadré plein largeur : un bloc bordé se lisait comme un champ
                de saisie alors que rien n'est modifiable ici. L'icône et la
                couleur suffisent à le distinguer, sans filet vertical.
              */}
              <p className="mt-3.5 flex gap-3 rounded-md bg-brand-soft p-3.5 text-[15px] font-semibold leading-relaxed text-brand">
                <Lightbulb size={17} className="mt-0.5 shrink-0" aria-hidden />
                {report.nextActions[0]?.title ?? "Poursuivez l'entraînement sur cette compétence."}
              </p>

              {/*
                Le bouton menait auparavant a l'ancre #conseils, qui ne faisait
                que descendre sur les points forts. Il ouvre desormais la page
                de conseils : priorite, chronologie de l'appel, gestes a changer
                et extraits reellement releves par le Coach.
              */}
              <ButtonLink
                href={`/commercial/simulations/${reportId}/conseils`}
                className="mt-4"
              >
                Voir les conseils du Coach
                <ArrowRight size={16} aria-hidden />
              </ButtonLink>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-3">
            {report.nextActions.map((action, index) => (
              <div key={`${action.title}-${index}`} className="rounded-md bg-mist/70 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-brand text-xs font-semibold tabular-nums text-white">
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

        <CoachProgressionPanel report={report} />

        <CoachNextMissionCard report={report} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        <CoachTranscriptPanel report={report} />

        {/* Lecture seule côté commercial : seul le manager peut écrire ici. */}
        <ReportCommentThread reportId={report.reportId} canWrite={false} />

        <CoachLimitationsPanel report={report} />

        <CoachDisclaimer variant="commercial" />
      </div>
    </>
  );
}
