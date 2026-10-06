import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Flag,
  ChevronDown,
  Info,
  MessageSquareQuote,
  Milestone,
  Minus,
  Rocket,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type {
  CoachConfidenceLevel,
  CoachEvidence,
  CoachHighlight,
  CoachKeyMoment,
  CoachKeyMomentType,
  CoachMissedOpportunity,
  CoachOutcome,
  CoachPsychologicalState,
  CoachReport,
  PreviousPriorityApplied,
} from "@/src/types/coach";
import type { CompetencyScore } from "@/src/types";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { ScoreBar, ScoreGauge } from "@/src/components/ScoreGauge";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { cx, formatTimer, scoreColor } from "@/src/lib/format";
import { COACH_COMPETENCY_SCALE } from "@/src/lib/coach/competency-scale";

/* ------------------------------------------------------------------ */
/* Conversions et libellés                                             */
/* ------------------------------------------------------------------ */

/** Les notes du Coach sont sur 10 ; les graphiques existants attendent /100. */
export function toCompetencyScores(report: CoachReport): CompetencyScore[] {
  return report.competencies.map((competency) => ({
    competencyId: competency.id,
    score: competency.score * 10,
  }));
}

export const OUTCOME_LABELS: Record<CoachOutcome, string> = {
  accepted: "Proposition acceptée",
  refused: "Refus du client",
  postponed: "Décision reportée",
  interrupted: "Échange interrompu",
  inconclusive: "Issue indéterminée",
};

const OUTCOME_TONES: Record<CoachOutcome, "positif" | "vigilance" | "critique" | "neutre"> = {
  accepted: "positif",
  refused: "critique",
  postponed: "vigilance",
  interrupted: "vigilance",
  inconclusive: "neutre",
};

export const CONFIDENCE_LABELS: Record<CoachConfidenceLevel, string> = {
  high: "Confiance élevée",
  medium: "Confiance modérée",
  low: "Confiance limitée",
};

export const KEY_MOMENT_META: Record<
  CoachKeyMomentType,
  { label: string; dot: string; text: string; icon: typeof CheckCircle2 }
> = {
  positive: { label: "Point fort", dot: "bg-positive", text: "text-positive", icon: CheckCircle2 },
  warning: { label: "Vigilance", dot: "bg-warning", text: "text-warning", icon: CircleAlert },
  objection: { label: "Objection", dot: "bg-info", text: "text-info", icon: MessageSquareQuote },
  turning_point: { label: "Bascule", dot: "bg-graphite", text: "text-graphite", icon: Milestone },
  conclusion: { label: "Conclusion", dot: "bg-brand", text: "text-brand-dark", icon: Flag },
};

/* ------------------------------------------------------------------ */
/* Blocs réutilisés par la vue commercial et la vue manager            */
/* ------------------------------------------------------------------ */

/** Score global, interprétation et issue de l'échange. */
export function CoachScorePanel({
  report,
  className,
}: {
  report: CoachReport;
  className?: string;
}) {
  return (
    <Panel title="Note globale" className={className} bodyClassName="flex flex-col items-center">
      <ScoreGauge score={report.overallScore} label="" caption="sur 100" />
      <p className="mt-3 text-center text-sm font-semibold text-ink">
        {report.scoreInterpretation}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Badge tone={OUTCOME_TONES[report.session.outcome]}>
          {OUTCOME_LABELS[report.session.outcome]}
        </Badge>
        <Badge>{CONFIDENCE_LABELS[report.confidenceLevel]}</Badge>
      </div>
      <p className="mt-3 text-center text-sm leading-relaxed text-graphite">
        {report.session.outcomeLabel}
      </p>
    </Panel>
  );
}

/** Radar des huit compétences, avec le barème pondéré. */
export function CoachRadarPanel({
  report,
  className,
}: {
  report: CoachReport;
  className?: string;
}) {
  return (
    <Panel
      title="Les huit compétences"
      description="Notes sur 10 converties sur 100 pour la lecture graphique."
      className={className}
    >
      <CompetencyRadar scores={toCompetencyScores(report)} seriesLabel="Cette simulation" />
    </Panel>
  );
}

/** Détail par compétence : note, poids, observation et preuves horodatées. */
export function CoachCompetencyDetail({ report }: { report: CoachReport }) {
  const sorted = [...report.competencies].sort((a, b) => a.score - b.score);

  return (
    <Panel
      title="Détail par compétence"
      description="Classées de la plus perfectible à la mieux maîtrisée. Ouvrez une carte pour voir les extraits qui justifient la note."
    >
      {/*
        `items-start` est indispensable : sans lui, chaque <li> est étiré à la
        hauteur de sa rangée de grille. En ouvrant une carte, la carte voisine
        restée fermée s’étirait elle aussi et affichait une grande zone vide
        sous son en-tête, comme si elle s’était ouverte sans contenu.
      */}
      <ul className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        {sorted.map((competency) => {
          const percent = competency.score * 10;
          const color = scoreColor(percent);
          return (
            <li key={competency.id} className="flex min-w-0">
              <details className="nm-card group w-full overflow-hidden">
                <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 transition-colors hover:bg-mist sm:p-5">
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-snug text-ink">
                        {competency.label}
                      </span>
                      <span className="nm-label mt-1 block">poids {competency.weight}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className="nm-display text-2xl tabular-nums"
                        style={{ color }}
                      >
                        {competency.score}
                        <span className="text-sm text-muted">/10</span>
                      </span>
                      <ChevronDown
                        size={17}
                        aria-hidden
                        className="text-muted transition-transform group-open:rotate-180"
                      />
                    </span>
                  </span>

                  <span
                    className="block h-1.5 w-full overflow-hidden rounded-full bg-mist"
                    role="img"
                    aria-label={`${competency.label} : ${competency.score} sur 10`}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </span>
                </summary>

                <div className="border-t border-line p-4 sm:p-5">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-graphite">{competency.observation}</p>
                  {competency.evidence.length > 0 ? (
                    <EvidenceList evidence={competency.evidence} />
                  ) : null}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Preuves courtes : uniquement les extraits fournis, jamais le transcript entier. */
export function EvidenceList({ evidence }: { evidence: CoachEvidence[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {evidence.map((item, index) => (
        <li
          key={`${item.timestampSeconds}-${index}`}
          className="flex gap-3 rounded-sm bg-mist/60 px-3 py-2"
        >
          <span className="font-mono text-xs font-semibold tabular-nums text-graphite">
            {formatTimer(item.timestampSeconds)}
          </span>
          <span className="min-w-0 text-xs leading-relaxed text-graphite">
            <span
              className={cx(
                "font-semibold",
                item.speaker === "commercial" ? "text-ink" : "text-brand-dark",
              )}
            >
              {item.speaker === "commercial" ? "Commercial" : "Julie"} :{" "}
            </span>
            {item.excerpt}
          </span>
        </li>
      ))}
    </ul>
  );
}

const PSYCH_GAUGES: {
  key: keyof CoachPsychologicalState;
  label: string;
  inverted?: boolean;
}[] = [
  { key: "confidence", label: "Confiance" },
  { key: "interest", label: "Intérêt" },
  { key: "understanding", label: "Compréhension" },
  { key: "perceivedValue", label: "Valeur perçue" },
  { key: "feltPressure", label: "Pression ressentie", inverted: true },
];

/** Cinq jauges internes estimées de Julie en fin d'échange. */
export function CoachPsychologicalPanel({
  report,
  className,
}: {
  report: CoachReport;
  className?: string;
}) {
  return (
    <Panel
      title="Ce que Julie a ressenti"
      description="Estimation pédagogique de son état en fin d'échange, pas une mesure scientifique."
      className={className}
    >
      <ul className="space-y-4">
        {PSYCH_GAUGES.map((gauge) => {
          const value = report.psychologicalState[gauge.key];
          // Une pression élevée est un signal négatif : la couleur est inversée.
          const colorValue = gauge.inverted ? 100 - value : value;
          return (
            <li key={gauge.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">
                  {gauge.label}
                  {gauge.inverted ? (
                    <span className="ml-1.5 text-xs font-normal text-graphite">
                      (élevé = défavorable)
                    </span>
                  ) : null}
                </span>
                <span className="text-sm font-semibold tabular-nums text-graphite">{value}</span>
              </div>
              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mist"
                role="img"
                aria-label={`${gauge.label} : ${value} sur 100`}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${value}%`, backgroundColor: scoreColor(colorValue) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Chronologie horodatée des moments clés identifiés par le Coach. */
export function CoachKeyMomentsPanel({
  moments,
  className,
}: {
  moments: CoachKeyMoment[];
  className?: string;
}) {
  return (
    <Panel
      title="Moments clés"
      description="Repères horodatés issus de l'échange réel."
      className={className}
    >
      <ol className="space-y-0">
        {moments.map((moment, index) => {
          const meta = KEY_MOMENT_META[moment.type];
          const Icon = meta.icon;
          const isLast = index === moments.length - 1;
          return (
            <li
              key={`${moment.timestampSeconds}-${index}`}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cx(
                    "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
                    meta.dot,
                  )}
                >
                  <Icon size={13} aria-hidden />
                </span>
                {!isLast ? <span className="mt-1 w-px flex-1 bg-line" aria-hidden /> : null}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                    {formatTimer(moment.timestampSeconds)}
                  </span>
                  <span
                    className={cx(
                      "text-[11px] font-semibold uppercase tracking-[0.1em]",
                      meta.text,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="mt-1 font-medium leading-snug text-ink">{moment.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-graphite">{moment.explanation}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/** Points forts ou axes d'amélioration, présentés en cartes. */
export function CoachHighlightsPanel({
  title,
  description,
  highlights,
  tone,
  className,
}: {
  title: string;
  description?: string;
  highlights: CoachHighlight[];
  tone: "positif" | "vigilance";
  className?: string;
}) {
  return (
    <Panel title={title} description={description} className={className}>
      <ul className="space-y-3">
        {highlights.map((highlight, index) => (
          <li
            key={`${highlight.title}-${index}`}
            className={cx(
              "rounded-md border p-4",
              tone === "positif" ? "border-positive/25 bg-positive/5" : "border-line bg-white",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">{highlight.title}</span>
              {highlight.timestampSeconds !== null ? (
                <span className="font-mono text-xs tabular-nums text-graphite">
                  {formatTimer(highlight.timestampSeconds)}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-graphite">{highlight.explanation}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Occasions manquées : jamais présentées comme des fautes, mais comme des leviers. */
export function CoachMissedOpportunitiesPanel({
  opportunities,
  className,
}: {
  opportunities: CoachMissedOpportunity[];
  className?: string;
}) {
  if (opportunities.length === 0) return null;

  return (
    <Panel
      title="Occasions manquées"
      description="Moments où une autre réaction aurait pu faire progresser l'échange."
      className={className}
    >
      <ul className="space-y-3">
        {opportunities.map((item, index) => (
          <li key={`${item.title}-${index}`} className="flex gap-3 rounded-md bg-mist/70 p-4">
            <span className="mt-0.5 shrink-0 text-warning">
              <CircleAlert size={16} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">{item.title}</span>
                {item.timestampSeconds !== null ? (
                  <span className="font-mono text-xs tabular-nums text-graphite">
                    {formatTimer(item.timestampSeconds)}
                  </span>
                ) : null}
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-graphite">
                {item.explanation}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Limites déclarées de l'analyse et niveau de confiance. */
export function CoachLimitationsPanel({
  report,
  className,
}: {
  report: CoachReport;
  className?: string;
}) {
  return (
    <Panel
      title="Portée de l'analyse"
      description="Ce que cette analyse ne permet pas d'affirmer."
      className={className}
      action={<Badge>{CONFIDENCE_LABELS[report.confidenceLevel]}</Badge>}
    >
      {report.limitations.length > 0 ? (
        <ul className="space-y-2.5">
          {report.limitations.map((limitation, index) => (
            <li
              key={`${limitation}-${index}`}
              className="flex gap-3 text-sm leading-relaxed text-graphite"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-graphite/50" aria-hidden />
              {limitation}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-graphite">Aucune limite particulière signalée.</p>
      )}

      {/*
        « Disponible / Indisponible » seul n'apprenait rien : personne ne sait
        ce qu'est la perception, ni pourquoi elle manque. Chaque ligne dit
        maintenant de quoi il s'agit et ce que son absence implique.
      */}
      <dl className="mt-5 space-y-4 border-t border-line pt-4 text-sm">
        <div>
          <dt className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">Transcript</span>
            <Badge tone={report.transcriptAvailable ? "positif" : "vigilance"} dot>
              {report.transcriptAvailable ? "Disponible" : "Indisponible"}
            </Badge>
          </dt>
          <dd className="mt-1.5 leading-relaxed text-graphite">
            Le dialogue mot à mot de l&apos;échange, horodaté.{" "}
            {report.transcriptAvailable
              ? "Il a été récupéré : chaque note s'appuie sur des phrases réellement prononcées."
              : "Il n'a pas pu être récupéré ; l'analyse repose alors sur des éléments partiels et sa fiabilité est moindre."}
          </dd>
        </div>
        <div>
          <dt className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">Perception</span>
            <Badge tone={report.perceptionAvailable ? "positif" : "vigilance"} dot>
              {report.perceptionAvailable ? "Disponible" : "Indisponible"}
            </Badge>
          </dt>
          <dd className="mt-1.5 leading-relaxed text-graphite">
            Observations visuelles produites automatiquement pendant l&apos;appel : attitude générale,
            signes d&apos;attention ou de décrochage. Tout descripteur physique ou démographique en est
            retiré avant d&apos;atteindre le Coach, et ces observations ne sont que des indices : elles
            ne suffisent jamais à justifier une note.{" "}
            {report.perceptionAvailable
              ? "Elles ont été prises en compte comme contexte."
              : "Aucune n'a été produite pour cet appel : le plus souvent parce que la caméra est restée éteinte, ou parce que la couche de perception n'est pas activée sur le personnage. L'analyse s'est donc appuyée uniquement sur ce qui a été dit."}
          </dd>
        </div>
      </dl>
    </Panel>
  );
}

/** Mention légale affichée sur les deux vues. */
export function CoachDisclaimer({ variant }: { variant: "commercial" | "manager" }) {
  const text =
    variant === "manager"
      ? "Cette analyse constitue une aide à la formation. Toute décision managériale doit reposer sur une appréciation humaine et sur plusieurs observations."
      : "Analyse générée automatiquement à des fins pédagogiques. Elle doit être interprétée avec recul et peut être revue par un responsable.";

  return (
    <p className="flex gap-3 rounded-md border border-line bg-mist/50 px-4 py-3 text-xs leading-relaxed text-graphite">
      <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
      {text}
    </p>
  );
}

/** Bandeau d'avertissement générique. */
export function CoachNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-warning-bright/40 bg-warning-soft p-4">
      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-warning" aria-hidden />
      <p className="text-sm leading-relaxed text-graphite">{children}</p>
    </div>
  );
}

/** Petit rappel des compétences les plus faibles, en barres. */
export function CoachCompetencyBars({ report }: { report: CoachReport }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {[...report.competencies]
        .sort((a, b) => b.score - a.score)
        .map((competency) => (
          <ScoreBar
            key={competency.id}
            score={competency.score * 10}
            label={competency.label}
          />
        ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mémoire pédagogique : progression et mission                        */
/* ------------------------------------------------------------------ */

const PRIORITY_APPLIED_META: Record<
  PreviousPriorityApplied,
  { label: string; tone: "positif" | "vigilance" | "critique" | "neutre" }
> = {
  yes: { label: "Priorité précédente appliquée", tone: "positif" },
  partially: { label: "Priorité précédente partiellement appliquée", tone: "vigilance" },
  no: { label: "Priorité précédente non appliquée", tone: "critique" },
  not_evaluable: { label: "Priorité précédente non évaluable", tone: "neutre" },
};

const DIRECTION_META = {
  improved: { label: "En progrès", icon: TrendingUp, text: "text-positive" },
  stable: { label: "Stable", icon: Minus, text: "text-graphite" },
  declined: { label: "En recul", icon: TrendingDown, text: "text-warning" },
} as const;

const competencyName = (id: string) =>
  COACH_COMPETENCY_SCALE.find((entry) => entry.id === id)?.label ?? id;

/**
 * Progression par rapport aux simulations précédentes. N'affiche rien pour un
 * compte rendu créé avant la mémoire pédagogique.
 */
export function CoachProgressionPanel({
  report,
  title = "Ma progression",
  className,
}: {
  report: CoachReport;
  title?: string;
  className?: string;
}) {
  const progression = report.progressionAnalysis;
  if (!progression) return null;

  if (!progression.hasHistory) {
    return (
      <Panel title={title} className={className}>
        <p className="text-sm leading-relaxed text-graphite">
          Cette simulation est le point de départ de votre progression. Les prochaines seront
          comparées à celle-ci.
        </p>
      </Panel>
    );
  }

  const applied = PRIORITY_APPLIED_META[progression.previousPriorityApplied];

  return (
    <Panel
      title={title}
      description="Lecture de l'évolution depuis vos simulations précédentes."
      className={className}
      action={<Badge tone={applied.tone}>{applied.label}</Badge>}
    >
      <p className="text-sm leading-relaxed text-graphite">{progression.summary}</p>
      {progression.previousPriorityComment ? (
        <p className="mt-2 text-sm leading-relaxed text-graphite">{progression.previousPriorityComment}</p>
      ) : null}

      {progression.progressPoints.length > 0 ? (
        <ul className="mt-4 space-y-3 border-t border-line pt-4">
          {progression.progressPoints.map((point, index) => {
            const meta = DIRECTION_META[point.direction];
            const Icon = meta.icon;
            return (
              <li key={`${point.competencyId}-${index}`} className="flex gap-3">
                <Icon size={16} className={cx("mt-0.5 shrink-0", meta.text)} aria-hidden />
                <span className="min-w-0 text-sm leading-relaxed text-graphite">
                  <span className="font-semibold text-ink">{competencyName(point.competencyId)}</span>
                  <span className={cx("ml-2 text-xs font-semibold", meta.text)}>{meta.label}</span>
                  <span className="block">{point.explanation}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Panel>
  );
}

/** Mission unique pour la prochaine simulation. N'affiche rien sans mission. */
export function CoachNextMissionCard({
  report,
  title = "Ma prochaine mission",
  className,
}: {
  report: CoachReport;
  title?: string;
  className?: string;
}) {
  const mission = report.nextMission;
  if (!mission) return null;

  return (
    <section
      aria-label={title}
      className={cx("rounded-lg border-2 border-brand bg-brand-soft p-6", className)}
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
        <Rocket size={15} aria-hidden />
        {title}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">{mission.title}</h2>
      <p className="mt-1 text-xs font-medium text-graphite">
        Compétence travaillée : {competencyName(mission.competencyId)}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-ink">{mission.instruction}</p>
      {mission.successCriteria ? (
        <p className="mt-4 flex gap-2 rounded-md bg-white/70 p-3.5 text-sm leading-relaxed text-graphite">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-positive" aria-hidden />
          <span>
            <span className="font-semibold text-ink">Critère de réussite : </span>
            {mission.successCriteria}
          </span>
        </p>
      ) : null}
    </section>
  );
}
