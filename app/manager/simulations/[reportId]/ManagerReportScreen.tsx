"use client";

import { FileSearch } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge, DemoBadge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";
import { ButtonLink } from "@/src/components/Button";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { useIsHydrated, useReport } from "@/src/lib/reports/use-reports";
import {
  CoachCompetencyDetail,
  CoachDisclaimer,
  CoachHighlightsPanel,
  CoachKeyMomentsPanel,
  CoachLimitationsPanel,
  CoachMissedOpportunitiesPanel,
  CoachPsychologicalPanel,
  CoachScorePanel,
  toCompetencyScores,
} from "@/src/components/coach/CoachShared";
import { DEMO_MANAGER_DASHBOARD } from "@/src/data/demo-manager";
import { ReportCommentThread } from "@/src/components/coach/ReportCommentThread";
import { formatDate, formatDuration } from "@/src/lib/format";

/** Vue managériale d'un compte rendu réel du Coach IA. */
export function ManagerReportScreen({ reportId }: { reportId: string }) {
  const report = useReport(reportId);
  const hydrated = useIsHydrated();

  if (!hydrated) {
    return <div className="py-16 text-center text-sm text-graphite">Chargement du compte rendu…</div>;
  }

  if (!report) {
    return (
      <>
        <PageHeader
          eyebrow="Espace manager"
          title="Compte rendu introuvable"
          back={{ href: "/manager/simulations", label: "Simulations" }}
        />
        <EmptyState
          image="/images/etats/aucun-resultat.jpg"
          icon={<FileSearch size={20} aria-hidden />}
          title="Ce compte rendu n'est pas disponible sur cet appareil"
          description="Les analyses de ce prototype sont enregistrées localement dans le navigateur qui a réalisé la simulation. Elles ne circulent pas encore entre postes."
          action={
            <ButtonLink href="/manager/simulations" variant="secondary">
              Retour aux simulations
            </ButtonLink>
          }
        />
      </>
    );
  }

  // Repère visuel : moyenne d'équipe issue des données de démonstration,
  // clairement identifiée comme telle et jamais fondue dans les chiffres réels.
  const demoTeamReference = report.competencies.map((competency) => ({
    competencyId: competency.id,
    score: DEMO_MANAGER_DASHBOARD.teamAverageScore,
  }));

  return (
    <>
      <PageHeader
        eyebrow={`Compte rendu : ${formatDate(report.session.date.slice(0, 10))}`}
        title={`Simulation de ${report.commercial.name}`}
        description={report.managerSummary}
        back={{ href: "/manager/simulations", label: "Simulations" }}
        actions={
          <ButtonLink href="/manager/commerciaux/alexandre-jego" variant="secondary">
            Fiche du commercial
          </ButtonLink>
        }
        meta={
          <>
            <Badge tone="marque">Analyse du Coach IA</Badge>
            <Badge>{formatDuration(report.session.durationSeconds)}</Badge>
            <Badge>{report.prospect.name}</Badge>
          </>
        }
      />

      <div className="space-y-6">
        {/* Contexte : objectifs choisis par le commercial */}
        <Panel
          title="Contexte de la simulation"
          description="Objectifs pédagogiques sélectionnés avant l'appel."
        >
          <div className="flex flex-wrap gap-2">
            {report.session.selectedObjectiveLabels.length > 0 ? (
              report.session.selectedObjectiveLabels.map((label) => (
                <Badge key={label} tone="marque">
                  {label}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-graphite">Aucun objectif enregistré pour cet appel.</span>
            )}
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-line pt-4 sm:grid-cols-2">
            <Row term="Commercial" detail={report.commercial.name} />
            <Row term="Cliente virtuelle" detail={report.prospect.name} />
            <Row term="Durée" detail={formatDuration(report.session.durationSeconds)} />
            <Row term="Issue" detail={report.session.outcomeLabel} />
          </dl>
        </Panel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <CoachScorePanel report={report} className="lg:col-span-2" />

          <Panel
            title="Compétences et repère d'équipe"
            description="La moyenne d'équipe affichée provient des données de démonstration."
            className="lg:col-span-3"
            action={<DemoBadge>Repère fictif</DemoBadge>}
          >
            <CompetencyRadar
              scores={toCompetencyScores(report)}
              seriesLabel="Analyse réelle"
              comparison={{
                label: "Moyenne d'équipe (démonstration)",
                scores: demoTeamReference,
              }}
            />
            <p className="mt-3 text-xs leading-relaxed text-graphite">
              Seule la série « Analyse réelle » provient du Coach IA. La moyenne d&apos;équipe est
              une donnée de démonstration, conservée uniquement comme repère visuel.
            </p>
          </Panel>
        </div>

        {/* Priorité pédagogique */}
        <Panel
          title="Priorité pédagogique"
          description="Axe d'accompagnement proposé, à valider par la direction commerciale."
        >
          <p className="text-base font-semibold text-ink">{report.pedagogicalPriority.label}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-graphite">
            {report.pedagogicalPriority.reason}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-3">
            {report.nextActions.map((action, index) => (
              <div key={`${action.title}-${index}`} className="rounded-md bg-mist/70 p-4">
                <p className="text-sm font-semibold leading-snug text-ink">{action.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite">{action.instruction}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CoachHighlightsPanel
            title="Points d'appui"
            description="À valoriser lors du prochain point individuel."
            highlights={report.strengths}
            tone="positif"
          />
          <CoachHighlightsPanel
            title="Axes de progression"
            description="À travailler en accompagnement."
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

        {/*
          Le commentaire est réellement envoyé : il est enregistré, puis une
          notification est poussée vers le profil du commercial concerné. Sur
          cette maquette mono-appareil, le commercial la retrouve dans son
          propre espace, sur ce même navigateur.
        */}
        <ReportCommentThread
          reportId={report.reportId}
          canWrite
          authorName={DEMO_MANAGER_DASHBOARD.profile.firstName + " " + DEMO_MANAGER_DASHBOARD.profile.lastName}
          authorRole="manager"
          notifyRecipientId={report.commercial.id}
          notifyHref={`/commercial/simulations/${report.reportId}`}
        />

        <CoachDisclaimer variant="manager" />
      </div>
    </>
  );
}

function Row({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2">
      <dt className="text-sm text-graphite">{term}</dt>
      <dd className="text-right text-sm font-medium text-ink">{detail}</dd>
    </div>
  );
}
