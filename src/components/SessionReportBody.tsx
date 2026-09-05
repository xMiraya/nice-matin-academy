import { Eye, FileText, Info } from "lucide-react";
import type { SessionReport } from "@/src/types";
import { COMPETENCIES, getCompetencyLabel } from "@/src/data/competencies";
import { Panel } from "@/src/components/Panel";
import { ScoreBar, ScoreGauge } from "@/src/components/ScoreGauge";
import { CompetencyRadar } from "@/src/components/charts/CompetencyRadar";
import { PsychologicalGauges } from "@/src/components/charts/PsychologicalGauges";
import { KeyMomentTimeline } from "@/src/components/KeyMomentTimeline";
import { TranscriptViewer } from "@/src/components/TranscriptViewer";
import { RecordingPlayerPlaceholder } from "@/src/components/RecordingPlayerPlaceholder";
import { CoachPriorityCard } from "@/src/components/CoachPriorityCard";
import { Badge } from "@/src/components/StatusBadge";
import { DIFFICULTY_LABELS, formatDate, formatDuration } from "@/src/lib/format";

interface SessionReportBodyProps {
  report: SessionReport;
  /** La vue manager ajoute la synthèse managériale et le champ de commentaire. */
  variant?: "commercial" | "manager";
  repName?: string;
}

/** Fiche d'identité de la conversation, commune aux deux vues. */
function ContextPanel({ report, repName }: { report: SessionReport; repName?: string }) {
  const rows: { term: string; detail: string }[] = [
    { term: "Conversation", detail: report.title },
    { term: "Date", detail: formatDate(report.date) },
    { term: "Personnage", detail: report.characterName },
    ...(repName ? [{ term: "Commercial", detail: repName }] : []),
    { term: "Objectif", detail: report.objectiveLabel },
    { term: "Niveau", detail: DIFFICULTY_LABELS[report.difficulty] },
    { term: "Durée", detail: formatDuration(report.durationSeconds) },
    { term: "Résultat", detail: report.outcome },
    ...(report.outcomeReason ? [{ term: "Motif", detail: report.outcomeReason }] : []),
    {
      term: "Enregistrement",
      detail: report.recordingAvailable ? "Disponible" : "Indisponible pour ce test",
    },
    {
      term: "Transcript",
      detail: report.transcriptAvailable ? "Disponible" : "Indisponible",
    },
  ];

  return (
    <Panel title="Contexte de la simulation">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.term} className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2">
            <dt className="text-sm text-graphite">{row.term}</dt>
            <dd className="text-right text-sm font-medium text-ink">{row.detail}</dd>
          </div>
        ))}
      </dl>

      {report.perceptionNotice ? (
        <p className="mt-5 flex gap-3 rounded-sm border border-line bg-mist/60 px-4 py-3 text-sm leading-relaxed text-graphite">
          <Eye size={16} className="mt-0.5 shrink-0" aria-hidden />
          {report.perceptionNotice}
        </p>
      ) : null}
    </Panel>
  );
}

/**
 * Corps du compte rendu du Coach IA, partagé par la vue commercial et la vue
 * manager afin d'éviter toute duplication entre les deux espaces.
 */
export function SessionReportBody({
  report,
  variant = "commercial",
  repName,
}: SessionReportBodyProps) {
  const sortedScores = [...report.competencyScores].sort((a, b) => b.score - a.score);
  const teamReference = COMPETENCIES.map((competency) => ({
    competencyId: competency.id,
    score: 67,
  }));

  return (
    <div className="space-y-6">
      {/* Avertissement sur la nature de l'appel */}
      {report.technicalTest ? (
        <div className="rounded-md border border-warning-bright/40 bg-warning-soft p-5">
          <div className="flex gap-3">
            <Info size={18} className="mt-0.5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">
                Appel de validation technique, volontairement agressif
              </p>
              <p className="mt-2 text-sm leading-relaxed text-graphite">
                Cet échange a servi à vérifier la voix française de Julie et sa capacité à
                interrompre une conversation. Le commercial a adopté une posture inadaptée de manière
                délibérée. Les scores ci-dessous décrivent donc le déroulé de ce test et ne
                constituent en aucun cas une évaluation des compétences réelles du commercial. Cet
                appel est exclu de toutes les statistiques individuelles et d&apos;équipe.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {variant === "manager" && report.managerSummary ? (
        <Panel title="Synthèse managériale">
          <p className="text-sm leading-relaxed text-graphite">{report.managerSummary}</p>
        </Panel>
      ) : null}

      {/* Score global + radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel title="Score global" className="lg:col-span-2" bodyClassName="flex flex-col items-center">
          <ScoreGauge score={report.globalScore} label="" caption="sur 100" />
          <p className="mt-2 text-center text-sm leading-relaxed text-graphite">
            {report.outcome}
            {report.outcomeReason ? `, ${report.outcomeReason.toLowerCase()}.` : "."}
          </p>
          {report.technicalTest ? (
            <Badge tone="vigilance" className="mt-4">
              Test technique : exclu des statistiques
            </Badge>
          ) : null}
        </Panel>

        <Panel
          title="Les huit compétences"
          description="Comparaison avec la moyenne d'équipe actuelle, à titre indicatif."
          className="lg:col-span-3"
        >
          <CompetencyRadar
            scores={report.competencyScores}
            seriesLabel="Cet appel"
            comparison={{ label: "Moyenne d'équipe", scores: teamReference }}
          />
        </Panel>
      </div>

      {/* Détail des compétences */}
      <Panel title="Détail par compétence">
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {sortedScores.map((score) => (
            <ScoreBar
              key={score.competencyId}
              score={score.score}
              label={getCompetencyLabel(score.competencyId)}
            />
          ))}
        </div>
      </Panel>

      {/* Jauges internes de Julie */}
      <Panel
        title="Ce que Julie a ressenti"
        description="Les cinq jauges internes du personnage, au début puis à la fin de l'échange."
      >
        <PsychologicalGauges start={report.psychologicalStart} end={report.psychologicalEnd} />
        <p className="mt-4 text-sm leading-relaxed text-graphite">
          La pression ressentie passe de {report.psychologicalStart.pressionRessentie} à{" "}
          {report.psychologicalEnd.pressionRessentie} sur 100, pendant que la confiance tombe de{" "}
          {report.psychologicalStart.confiance} à {report.psychologicalEnd.confiance}. C&apos;est
          cette combinaison qui déclenche la fin de l&apos;échange.
        </p>
      </Panel>

      {/* Chronologie + observations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel
          title={variant === "manager" ? "Événements clés" : "Moments clés"}
          description="Chronologie horodatée de l'échange."
          className="lg:col-span-3"
        >
          <KeyMomentTimeline moments={report.keyMoments} />
        </Panel>

        <Panel title="Points observés" className="lg:col-span-2">
          <ul className="space-y-3">
            {report.observations.map((observation) => (
              <li key={observation} className="flex gap-3 text-sm leading-relaxed text-graphite">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {observation}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Priorités */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Priorités</h2>
          <p className="mt-1 text-sm text-graphite">
            Trois axes de travail proposés par le Coach IA, du plus structurant au plus fin.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {report.priorities.slice(0, 3).map((priority, index) => (
            <CoachPriorityCard key={priority.title} priority={priority} index={index + 1} />
          ))}
        </div>
      </div>

      {/*
        Enregistrement et transcript réunis dans une seule carte pleine largeur.
        Côte à côte, l'enregistrement — réduit à un bandeau tant qu'aucune vidéo
        n'est rattachée — laissait une zone morte à sa droite, et déplier le
        transcript rouvrait ce vide de plus belle.
      */}
      <Panel
        title="Enregistrement et transcript"
        description="Le dialogue est replié par défaut."
        action={<FileText size={18} className="text-graphite" aria-hidden />}
      >
        <RecordingPlayerPlaceholder
          notice={report.recordingNotice ?? "Aucun enregistrement disponible"}
        />

        <div className="mt-5 border-t border-line pt-5">
          <TranscriptViewer
            lines={report.transcript}
            characterName={report.characterName}
            repName={repName ?? "Commercial"}
          />
        </div>
      </Panel>

      <ContextPanel report={report} repName={variant === "manager" ? repName : undefined} />
    </div>
  );
}
