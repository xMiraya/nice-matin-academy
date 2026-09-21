import { MessageSquareText } from "lucide-react";
import type { TranscriptLine } from "@/src/types";
import type { CoachReport } from "@/src/types/coach";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { TranscriptViewer } from "@/src/components/TranscriptViewer";
import { formatTimer } from "@/src/lib/format";

/**
 * Reconstitue un dialogue partiel à partir des extraits cités par le Coach.
 *
 * Sert de repli pour les comptes rendus produits avant que le transcript ne
 * soit conservé. Ce n'est pas l'échange complet, et c'est dit à l'écran :
 * seules les répliques que le Coach a retenues comme preuves y figurent.
 */
function transcriptFromEvidence(report: CoachReport): TranscriptLine[] {
  const seen = new Set<string>();
  const lines: TranscriptLine[] = [];

  for (const competency of report.competencies) {
    for (const evidence of competency.evidence) {
      const key = `${evidence.timestampSeconds}-${evidence.excerpt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push({
        speaker: evidence.speaker,
        timestamp: formatTimer(evidence.timestampSeconds),
        text: evidence.excerpt,
      });
    }
  }

  return lines.sort((a, b) => (a.timestamp ?? "").localeCompare(b.timestamp ?? ""));
}

/** Fiche repliable contenant le dialogue de l'entretien. */
export function CoachTranscriptPanel({
  report,
  className,
}: {
  report: CoachReport;
  className?: string;
}) {
  const stored = report.transcript ?? [];
  const complete = stored.length > 0;
  const lines = complete ? stored : transcriptFromEvidence(report);

  if (lines.length === 0) {
    return (
      <Panel
        title="Transcript de l'entretien"
        description="Le dialogue mot à mot de votre échange avec Julie."
        className={className}
      >
        <p className="text-sm leading-relaxed text-graphite">
          Aucun dialogue n&apos;est disponible pour cette simulation. Les comptes rendus produits
          avant l&apos;ajout de cette fiche ne conservaient pas le transcript ; il sera présent sur
          vos prochaines simulations.
        </p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Transcript de l'entretien"
      description={
        complete
          ? "Le dialogue mot à mot de votre échange avec Julie, horodaté depuis le début de l'appel."
          : "Ce compte rendu ne conservait pas le dialogue complet. Voici les répliques que le Coach a citées comme preuves."
      }
      className={className}
      action={
        complete ? (
          <Badge tone="positif" dot>
            {lines.length} répliques
          </Badge>
        ) : (
          <Badge tone="vigilance">Extraits seulement</Badge>
        )
      }
    >
      <TranscriptViewer
        lines={lines}
        repName={report.commercial.name}
        characterName={report.prospect.name}
        notice={
          complete
            ? undefined
            : "Dialogue partiel : seules les répliques retenues comme preuves par le Coach sont affichées."
        }
      />

      <p className="mt-4 flex gap-3 rounded-md bg-mist/70 px-4 py-3 text-xs leading-relaxed text-graphite">
        <MessageSquareText size={15} className="mt-0.5 shrink-0 text-brand" aria-hidden />
        Le transcript est enregistré avec le reste du compte rendu, sur votre compte. Il est visible de
        vous et de votre manager.
      </p>
    </Panel>
  );
}
