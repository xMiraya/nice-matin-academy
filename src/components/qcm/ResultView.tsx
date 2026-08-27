"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel, SectionTitle } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { CompetencyChart } from "@/src/components/qcm/CompetencyChart";
import { Correction } from "@/src/components/qcm/Correction";
import { getAssessmentById } from "@/src/data/qcm/assessments";
import { getCompetency } from "@/src/data/qcm/competencies";
import { qcmRoutes } from "@/src/data/qcm/routes";
import { recommendationsFor } from "@/src/lib/qcm/recommendations";
import { formatDuration, getBand } from "@/src/lib/qcm/scoring";
import { useProgress } from "@/src/lib/qcm/useProgress";

export function ResultView({ resultId }: { readonly resultId: string }) {
  const { progress, ready } = useProgress();

  if (!ready) {
    return <p className="text-sm text-graphite">Chargement de votre résultat…</p>;
  }

  const result = progress.results.find((r) => r.id === resultId);
  if (!result) {
    return (
      <>
        <PageHeader
          eyebrow="Entraînement QCM"
          title="Résultat introuvable"
          back={{ href: qcmRoutes.assessments, label: "Évaluations" }}
        />
        <EmptyState
          title="Ce résultat n’est pas disponible sur cet appareil"
          description="Les résultats sont enregistrés localement, dans le navigateur utilisé pour passer l’évaluation. Ils ne sont ni transmis ni partagés."
          action={<ButtonLink href={qcmRoutes.assessments}>Revenir aux évaluations</ButtonLink>}
        />
      </>
    );
  }

  const assessment = getAssessmentById(result.assessmentId);
  const band = getBand(result.band);
  const recommendations = recommendationsFor(result);
  const errors = result.perQuestion.filter((r) => r.outcome !== "correct");
  const tone = result.percent >= 80 ? "positif" : result.percent >= 65 ? "information" : "vigilance";

  return (
    <>
      <PageHeader
        eyebrow={`${assessment?.kicker ?? "Évaluation"} · niveau ${result.level}`}
        title={assessment?.title ?? "Résultat"}
        back={{ href: qcmRoutes.assessments, label: "Évaluations" }}
        actions={
          <>
            <ButtonLink href={qcmRoutes.assessmentFor(result.level)} variant="secondary">
              Refaire cette évaluation
            </ButtonLink>
            <ButtonLink href={qcmRoutes.progress} variant="ghost">
              Voir ma progression
            </ButtonLink>
          </>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-end gap-6">
          <p className="nm-display text-5xl tabular-nums text-ink">
            {result.percent}
            <span className="text-2xl"> %</span>
          </p>
          <div>
            <p className="nm-label">Niveau atteint</p>
            <p className="mt-1.5 flex items-center gap-2 text-lg font-semibold text-ink">
              {band.label}
              <Badge tone={tone} dot>
                {result.earned} / {result.max} points
              </Badge>
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-graphite">{band.message}</p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Réponses correctes" value={String(result.correctCount)} />
          <Stat label="Réponses partielles" value={String(result.partialCount)} />
          <Stat label="Réponses incorrectes" value={String(result.incorrectCount)} />
          <Stat label="Sans réponse" value={String(result.unansweredCount)} />
          <Stat label="Temps passé" value={formatDuration(result.durationSeconds)} />
        </dl>
      </Panel>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Résultat par compétence" className="lg:col-span-2">
          <CompetencyChart scores={result.perCompetency} />
        </Panel>

        <div className="grid grid-cols-1 gap-5">
          <Panel title="Points forts">
            {result.strengths.length === 0 ? (
              <p className="text-sm leading-relaxed text-graphite">
                Aucune compétence n’atteint encore le seuil de maîtrise sur cette évaluation.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-ink">
                {result.strengths.map((id) => (
                  <li key={id}>{getCompetency(id).label}</li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Compétences à retravailler">
            {result.toImprove.length === 0 ? (
              <p className="text-sm leading-relaxed text-graphite">
                Aucune compétence ne se situe sous le seuil d’alerte sur cette évaluation.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {result.toImprove.map((id) => (
                  <li key={id}>
                    <Link
                      href={qcmRoutes.trainingFor(id)}
                      className="font-medium text-brand underline underline-offset-4 hover:text-brand-accent"
                    >
                      {getCompetency(id).label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <Panel className="mt-5" title="Ce que nous vous conseillons ensuite">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((reco) => (
              <li key={reco.href + reco.title}>
                <Link
                  href={reco.href}
                  className="group flex h-full flex-col rounded-sm border border-line bg-mist/60 p-4 transition-colors hover:border-brand-accent hover:bg-brand-soft"
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink group-hover:text-brand">
                    {reco.title}
                    <ArrowRight
                      size={14}
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="mt-1.5 text-sm leading-relaxed text-graphite">
                    {reco.reason}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="mt-8">
        <SectionTitle
          description={
            errors.length === 0
              ? "Toutes vos réponses sont correctes. La correction complète reste consultable ci-dessous."
              : `${errors.length} question${errors.length > 1 ? "s" : ""} à revoir. Chaque correction indique la compétence concernée et la pratique attendue sur le terrain.`
          }
        >
          Correction détaillée
        </SectionTitle>

        <div className="space-y-6">
          {assessment?.questions.map((question, position) => {
            const questionResult = result.perQuestion.find((r) => r.questionId === question.id);
            if (!questionResult) return null;
            return (
              <article key={question.id} className="nm-card p-5 sm:p-6">
                <p className="nm-label">Question {position + 1}</p>
                {question.scenario ? (
                  <p className="mt-2.5 max-w-prose text-sm italic leading-relaxed text-graphite">
                    {question.scenario}
                  </p>
                ) : null}
                <h3 className="mt-1.5 max-w-prose text-base font-semibold leading-snug text-ink">
                  {question.prompt}
                </h3>
                <Correction question={question} result={questionResult} />
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-mist/70 p-4">
      <dt className="nm-label">{label}</dt>
      <dd className="mt-1.5 text-lg font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
