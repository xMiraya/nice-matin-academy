"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel, SectionTitle } from "@/src/components/Panel";
import { ButtonLink } from "@/src/components/Button";
import { EmptyState } from "@/src/components/EmptyState";
import { CompetencyChart } from "@/src/components/qcm/CompetencyChart";
import { AssessmentCorrections } from "@/src/components/qcm/AssessmentCorrections";
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

      {/*
        Bandeau de résultat : le score occupe toute la largeur plutôt qu'un coin
        de carte, et le commentaire pédagogique est ramené à une seule phrase.
        Le détail complet se lit plus bas, compétence par compétence.
      */}
      <section className="nm-card nm-navy overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
          <div className="flex items-center gap-6">
            <p className="nm-display text-6xl leading-none tabular-nums text-white sm:text-7xl">
              {result.percent}
              <span className="text-3xl text-white/60"> %</span>
            </p>
            <div className="min-w-0">
              <p className="nm-label text-white/60">Niveau atteint</p>
              <p className="mt-1.5 text-xl font-semibold leading-tight text-white sm:text-2xl">
                {band.label}
              </p>
              <p className="mt-2 text-sm font-semibold tabular-nums text-brand-sky">
                {result.earned} / {result.max} points · {result.correctCount} bonne
                {result.correctCount > 1 ? "s" : ""} réponse
                {result.correctCount > 1 ? "s" : ""} sur {result.perQuestion.length}
              </p>
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-8 gap-y-4">
            <HeroStat label="Partielles" value={String(result.partialCount)} />
            <HeroStat label="Incorrectes" value={String(result.incorrectCount)} />
            <HeroStat label="Sans réponse" value={String(result.unansweredCount)} />
            <HeroStat label="Temps passé" value={formatDuration(result.durationSeconds)} />
          </dl>
        </div>

        <p className="mt-6 max-w-3xl border-t border-white/15 pt-5 text-sm leading-relaxed text-brand-sky">
          {band.message}
        </p>
      </section>

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
                  className="nm-card-link group flex h-full flex-col rounded-sm p-4"
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
              : `${errors.length} question${errors.length > 1 ? "s" : ""} à revoir. Ouvrez une carte pour voir la correction commentée.`
          }
        >
          Correction détaillée
        </SectionTitle>

        {assessment ? (
          <AssessmentCorrections
            questions={assessment.questions}
            results={result.perQuestion}
          />
        ) : null}
      </div>
    </>
  );
}

/** Chiffre secondaire du bandeau de résultat, sur fond marine. */
function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="nm-label text-white/55">{label}</dt>
      <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-white">{value}</dd>
    </div>
  );
}
