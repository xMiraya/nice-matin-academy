import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Flag,
  Info,
  MessageSquareQuote,
  Milestone,
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
} from "@/src/types/coach";
import type { CompetencyScore } from "@/src/types";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { ScoreBar, ScoreGauge } from "@/src/components/ScoreGauge";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { cx, formatTimer, scoreColor } from "@/src/lib/format";

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

const KEY_MOMENT_META: Record<
  CoachKeyMomentType,
  { label: string; dot: string; text: string; icon: typeof CheckCircle2 }
> = {
  positive: { label: "Point fort", dot: "bg-positive", text: "text-positive", icon: CheckCircle2 },
  warning: { label: "Vigilance", dot: "bg-warning", text: "text-[#8a5900]", icon: CircleAlert },
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
  return (
    <Panel
      title="Détail par compétence"
      description="Chaque note est justifiée par des extraits réellement prononcés."
    >
      <ul className="space-y-5">
        {report.competencies.map((competency) => (
          <li key={competency.id} className="border-b border-line/70 pb-5 last:border-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-ink">{competency.label}</span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-graphite">poids {competency.weight}</span>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: scoreColor(competency.score * 10) }}
                >
                  {competency.score} / 10
                </span>
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${competency.score * 10}%`,
                  backgroundColor: scoreColor(competency.score * 10),
                }}
              />
            </div>

            <p className="mt-2.5 text-sm leading-relaxed text-graphite">{competency.observation}</p>

            {competency.evidence.length > 0 ? (
              <EvidenceList evidence={competency.evidence} />
            ) : null}
          </li>
        ))}
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
            <p className="mt-1.5 text-sm leading-relaxed text-graphite">{highlight.explanation}</p>
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
          <li key={`${item.title}-${index}`} className="flex gap-3 rounded-md border border-line p-4">
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

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="nm-label">Transcript</dt>
          <dd className="mt-1 font-medium text-ink">
            {report.transcriptAvailable ? "Disponible" : "Indisponible"}
          </dd>
        </div>
        <div>
          <dt className="nm-label">Perception</dt>
          <dd className="mt-1 font-medium text-ink">
            {report.perceptionAvailable ? "Disponible" : "Indisponible"}
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
    <div className="flex gap-3 rounded-md border border-warning/40 bg-warning/8 p-4">
      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#8a5900]" aria-hidden />
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
