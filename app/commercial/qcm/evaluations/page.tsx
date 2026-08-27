import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { ButtonLink } from "@/src/components/Button";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { MASTERY_BANDS, MULTIPLE_CHOICE_RULE, PROGRESSION_MODE } from "@/src/data/qcm/config";
import { qcmRoutes } from "@/src/data/qcm/routes";

export const metadata: Metadata = {
  title: "Les cinq évaluations",
  description: "Cinq niveaux progressifs mêlant les huit compétences commerciales.",
};

export default function AssessmentsIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Entraînement QCM"
        title="Cinq niveaux progressifs"
        description="Chaque évaluation mélange les huit compétences : les questions ne sont pas regroupées par thème, afin que vous identifiiez vous-même la compétence à mobiliser. La correction détaillée s’affiche après l’envoi complet de vos réponses."
        back={{ href: qcmRoutes.home, label: "Entraînement QCM" }}
        meta={
          PROGRESSION_MODE === "libre" ? (
            <Badge tone="information">
              Progression libre — les cinq niveaux sont accessibles dès maintenant
            </Badge>
          ) : null
        }
      />

      <ol className="space-y-5">
        {ASSESSMENTS.map((assessment) => (
          <li key={assessment.id}>
            <article className="nm-card p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="nm-label">
                  Niveau {assessment.level} · {assessment.levelLabel}
                </p>
                <p className="text-[13px] text-muted">
                  {assessment.questions.length} questions · environ {assessment.indicativeMinutes}{" "}
                  min
                </p>
              </div>

              <h2 className="nm-display mt-2 text-xl text-ink">
                <Link
                  href={qcmRoutes.assessmentFor(assessment.level)}
                  className="underline-offset-4 hover:text-brand hover:underline"
                >
                  {assessment.title}
                </Link>
              </h2>
              <p className="mt-2 max-w-prose text-sm font-medium text-brand">
                {assessment.objective}
              </p>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-graphite">
                {assessment.description}
              </p>

              <ButtonLink className="mt-5" href={qcmRoutes.assessmentFor(assessment.level)}>
                Passer le niveau {assessment.level}
              </ButtonLink>
            </article>
          </li>
        ))}
      </ol>

      <Panel className="mt-5" title="Comment le score est calculé">
        <p className="max-w-prose text-sm leading-relaxed text-graphite">{MULTIPLE_CHOICE_RULE}</p>
        <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-graphite">
          Chaque question vaut un point, quel que soit son format. Les questions de classement sont
          notées au prorata des positions correctes. Aucun score négatif n’est possible.
        </p>

        <h3 className="nm-label mt-6">Niveaux de maîtrise (seuils provisoires)</h3>
        <dl className="mt-3 space-y-2 text-sm">
          {[...MASTERY_BANDS].reverse().map((band) => (
            <div
              key={band.id}
              className="flex flex-wrap gap-x-4 gap-y-1 rounded-sm bg-mist/70 px-3.5 py-2.5"
            >
              <dt className="w-32 shrink-0 font-semibold tabular-nums text-ink">
                {band.minPercent} % et plus
              </dt>
              <dd className="text-graphite">{band.label}</dd>
            </div>
          ))}
        </dl>
        <Badge tone="vigilance" className="mt-4">
          Seuils à valider par l’équipe formation Nice-Matin
        </Badge>
      </Panel>
    </>
  );
}
