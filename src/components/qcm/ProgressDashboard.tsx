"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/src/components/Button";
import { Panel } from "@/src/components/Panel";
import { Badge, type BadgeTone } from "@/src/components/StatusBadge";
import { CompetencyChart } from "@/src/components/qcm/CompetencyChart";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { COMPETENCIES, COMPETENCY_IDS, getCompetency } from "@/src/data/qcm/competencies";
import { IMPROVE_RATIO } from "@/src/data/qcm/config";
import { qcmRoutes } from "@/src/data/qcm/routes";
import {
  bestPercent,
  competencyAverages,
  isLevelUnlocked,
  lastResult,
  resultsFor,
  trainedCompetencies,
} from "@/src/lib/qcm/progression";
import { formatDuration } from "@/src/lib/qcm/scoring";
import { useProgress } from "@/src/lib/qcm/useProgress";
import type { CompetencyScore } from "@/src/types/qcm/quiz";

export function ProgressDashboard() {
  const { progress, ready, reset } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!ready) return <p className="text-sm text-graphite">Chargement de votre progression…</p>;

  const trained = trainedCompetencies(progress);
  const averages = competencyAverages(progress);
  const latest = lastResult(progress);

  const scores: readonly CompetencyScore[] = COMPETENCY_IDS.map((id) => {
    const ratio = averages[id] ?? 0;
    const evaluated = id in averages;
    return {
      competency: id,
      earned: ratio,
      max: evaluated ? 1 : 0,
      ratio,
      questionCount: evaluated ? 1 : 0,
    };
  });

  const toReview = scores.filter((s) => s.questionCount > 0 && s.ratio < IMPROVE_RATIO);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 sm:grid-cols-3">
        <SummaryCard label="Compétences travaillées" value={`${trained.length} / 8`} />
        <SummaryCard label="Questionnaires terminés" value={String(progress.results.length)} />
        <SummaryCard
          label="Dernier résultat"
          value={latest ? `${latest.percent} %` : "—"}
          hint={latest ? undefined : "aucun pour le moment"}
        />
      </section>

      {progress.results.length > 0 ? (
        <Panel
          title="Moyenne par compétence"
          description="Toutes évaluations confondues, sur cet appareil."
        >
          <CompetencyChart scores={scores} />
        </Panel>
      ) : null}

      <Panel title="Évaluations" bodyClassName="overflow-x-auto nm-scroll">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">État des cinq évaluations</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="nm-label pb-2.5">
                Niveau
              </th>
              <th scope="col" className="nm-label pb-2.5">
                État
              </th>
              <th scope="col" className="nm-label pb-2.5">
                Meilleur
              </th>
              <th scope="col" className="nm-label pb-2.5">
                Dernier
              </th>
              <th scope="col" className="nm-label pb-2.5">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {ASSESSMENTS.map((assessment) => {
              const done = resultsFor(progress, assessment.id);
              const best = bestPercent(progress, assessment.id);
              const last = lastResult(progress, assessment.id);
              const unlocked = isLevelUnlocked(progress, assessment.level);
              const open = progress.openSessions[assessment.id];

              const state: { label: string; tone: BadgeTone } = !unlocked
                ? { label: "à débloquer", tone: "neutre" }
                : open
                  ? { label: "session en cours", tone: "information" }
                  : done.length > 0
                    ? {
                        label: `${done.length} passage${done.length > 1 ? "s" : ""}`,
                        tone: "positif",
                      }
                    : { label: "disponible", tone: "marque" };

              return (
                <tr key={assessment.id} className="border-b border-line/70 align-middle">
                  <th scope="row" className="py-3 pr-4 text-left font-medium text-ink">
                    {assessment.level} : {assessment.title}
                  </th>
                  <td className="py-3 pr-4">
                    <Badge tone={state.tone} dot>
                      {state.label}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-graphite">
                    {best === null ? "—" : `${best} %`}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-graphite">
                    {last === null ? "—" : `${last.percent} %`}
                  </td>
                  <td className="py-3">
                    {unlocked ? (
                      <Link
                        href={qcmRoutes.assessmentFor(assessment.level)}
                        className="font-medium text-brand underline underline-offset-4 hover:text-brand-accent"
                      >
                        {open ? "reprendre" : done.length > 0 ? "refaire" : "commencer"}
                      </Link>
                    ) : (
                      <span className="text-muted">niveau précédent à valider</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel title="Entraînements ciblés" description="Quinze questions disponibles par compétence.">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {COMPETENCIES.map((competency) => {
            const records = progress.trainings.filter((t) => t.competency === competency.id);
            return (
              <li
                key={competency.id}
                className="flex items-baseline justify-between gap-3 rounded-sm bg-mist/70 px-3.5 py-2.5 text-sm"
              >
                <Link
                  href={qcmRoutes.trainingFor(competency.id)}
                  className="font-medium text-brand underline underline-offset-4 hover:text-brand-accent"
                >
                  {competency.label}
                </Link>
                <span className="shrink-0 text-[13px] text-muted">
                  {records.length === 0
                    ? "jamais travaillée"
                    : `${records.length} série${records.length > 1 ? "s" : ""}`}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      {toReview.length > 0 || latest ? (
        <Panel title="Recommandations">
          <ul className="space-y-3 text-sm">
            {toReview.slice(0, 3).map((score) => (
              <li key={score.competency}>
                <Link
                  href={qcmRoutes.trainingFor(score.competency)}
                  className="font-semibold text-brand underline underline-offset-4 hover:text-brand-accent"
                >
                  Travailler : {getCompetency(score.competency).label}
                </Link>
                <p className="mt-0.5 text-graphite">
                  Moyenne actuelle sur cette compétence : {Math.round(score.ratio * 100)} %.
                </p>
              </li>
            ))}
            {latest ? (
              <li>
                <Link
                  href={qcmRoutes.result(latest.id)}
                  className="font-semibold text-brand underline underline-offset-4 hover:text-brand-accent"
                >
                  Revoir la correction de votre dernière évaluation
                </Link>
                <p className="mt-0.5 text-graphite">
                  Passée le {new Date(latest.completedAt).toLocaleDateString("fr-FR")}, temps
                  passé : {formatDuration(latest.durationSeconds)}.
                </p>
              </li>
            ) : null}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Données locales">
        <p className="max-w-prose text-sm leading-relaxed text-graphite">
          Toute votre progression sur les QCM est stockée dans ce navigateur. La supprimer est
          définitif et n’affecte aucun autre appareil. Les simulations analysées par le Coach IA ne
          sont pas concernées.
        </p>
        {confirmReset ? (
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              variant="danger"
              onClick={() => {
                reset();
                setConfirmReset(false);
              }}
            >
              Confirmer la suppression
            </Button>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="mt-4" onClick={() => setConfirmReset(true)}>
            Effacer ma progression QCM
          </Button>
        )}
      </Panel>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="nm-card p-5">
      <p className="nm-label">{label}</p>
      <p className="nm-display mt-2 text-3xl tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-[13px] text-muted">{hint}</p> : null}
    </div>
  );
}
