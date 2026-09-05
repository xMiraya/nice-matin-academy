"use client";

import {
  ArrowRight,
  CircleAlert,
  FileSearch,
  Lightbulb,
  Quote,
  Target,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/src/components/PageHeader";
import { Panel } from "@/src/components/Panel";
import { Badge, DemoBadge } from "@/src/components/StatusBadge";
import { EmptyState } from "@/src/components/EmptyState";
import { ButtonLink } from "@/src/components/Button";
import { CoachMascot } from "@/src/components/coach/CoachMascot";
import type { CoachEvidence } from "@/src/types/coach";
import { useIsHydrated, useReport } from "@/src/lib/reports/use-reports";
import { CoachTranscriptPanel } from "@/src/components/coach/CoachTranscriptPanel";
import { CallTimeline, CallTimelineLegend } from "@/src/components/coach/CallTimeline";
import {
  CoachDisclaimer,
  CoachLimitationsPanel,
  CoachPsychologicalPanel,
  EvidenceList,
} from "@/src/components/coach/CoachShared";
import { DIFFICULTY_LABELS, cx, formatTimer, scoreColor } from "@/src/lib/format";

/**
 * Extraits d'illustration.
 *
 * Utilisés uniquement lorsque le Coach n'a retenu aucune preuve pour la
 * compétence prioritaire, afin de montrer la forme du bloc. Ils sont toujours
 * accompagnés d'une mention « Exemple » et ne sont jamais mêlés à une analyse.
 */
const EXAMPLE_EVIDENCE: CoachEvidence[] = [
  {
    timestampSeconds: 148,
    speaker: "julie",
    excerpt: "Franchement, je trouve ça cher pour ce que j'en ferais.",
  },
  {
    timestampSeconds: 159,
    speaker: "commercial",
    excerpt: "Je peux vous faire le premier mois offert si vous souscrivez aujourd'hui.",
  },
];

/**
 * Conseils du Coach IA pour une simulation donnée.
 *
 * Cette page ne réaffiche pas le compte rendu : elle ne retient que ce qui
 * demande une action. Tout ce qu'elle montre provient de l'analyse réellement
 * produite pour cet appel — priorité pédagogique, gestes à changer, extraits
 * horodatés, occasions manquées. Aucun conseil générique n'est ajouté.
 */
export function CoachAdviceScreen({ reportId }: { reportId: string }) {
  const report = useReport(reportId);
  const hydrated = useIsHydrated();

  if (!hydrated) {
    return <div className="py-16 text-center text-sm text-graphite">Chargement des conseils…</div>;
  }

  if (!report) {
    return (
      <>
        <PageHeader
          eyebrow="Espace commercial"
          title="Conseils indisponibles"
          back={{ href: "/commercial/simulations", label: "Mes simulations" }}
        />
        <EmptyState
          icon={<FileSearch size={20} aria-hidden />}
          title="Ce compte rendu n'est pas disponible sur cet appareil"
          description="Les analyses de ce prototype sont enregistrées localement dans le navigateur. Elles ne sont pas partagées entre appareils ni entre navigateurs."
          action={
            <ButtonLink href="/commercial/nouvelle-simulation" variant="secondary">
              Lancer une nouvelle simulation
            </ButtonLink>
          }
        />
      </>
    );
  }

  const priority = report.pedagogicalPriority;
  const priorityCompetency = report.competencies.find((item) => item.id === priority.competencyId);
  const priorityPercent = priorityCompetency ? priorityCompetency.score * 10 : 0;

  // Les repères qui appellent une correction, du plus tôt au plus tard.
  const alerts = [...report.keyMoments]
    .filter((moment) => moment.type === "warning" || moment.type === "turning_point")
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds);

  return (
    <>
      <PageHeader
        eyebrow="Coach IA"
        title="Vos conseils"
        description="Ce que le Coach a relevé pendant cet appel, et les gestes à changer au prochain."
        back={{ href: `/commercial/simulations/${reportId}`, label: "Compte rendu complet" }}
        actions={
          <ButtonLink href="/commercial/nouvelle-simulation">
            Rejouer cet objectif
            <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        }
        meta={
          <>
            <Badge tone="marque">{priority.label}</Badge>
            {report.session.difficulty ? (
              <Badge>Niveau {DIFFICULTY_LABELS[report.session.difficulty].toLowerCase()}</Badge>
            ) : null}
            {report.session.selectedObjectiveLabels.map((label) => (
              <Badge key={label}>{label}</Badge>
            ))}
            <Badge tone="information">
              {formatTimer(report.session.durationSeconds)} d&apos;échange
            </Badge>
          </>
        }
      />

      <div className="space-y-5">
        {/* 1 — La priorité, avec le premier geste à poser */}
        <article className="nm-navy relative overflow-hidden rounded-lg p-6 shadow-lift sm:p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-sky/15 blur-2xl"
          />
          <div className="relative flex flex-wrap items-start gap-5">
            <CoachMascot size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-sky">
                Compétence à travailler en premier
              </p>
              <h2 className="nm-display mt-2 flex flex-wrap items-baseline gap-x-3 text-2xl text-white">
                {priority.label}
                {priorityCompetency ? (
                  <span className="text-base font-normal text-white/60">
                    {priorityCompetency.score} / 10
                  </span>
                ) : null}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
                {priority.reason}
              </p>

              {priorityCompetency ? (
                <span className="mt-4 flex h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white/15">
                  <span
                    className="h-full rounded-full"
                    style={{
                      width: `${priorityPercent}%`,
                      backgroundColor: scoreColor(priorityPercent),
                    }}
                  />
                </span>
              ) : null}
            </div>
          </div>

          {report.nextActions[0] ? (
            <div className="relative mt-6 rounded-md border border-white/12 bg-white/8 p-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-sky">
                <Lightbulb size={13} aria-hidden />
                Le geste à poser au prochain appel
              </p>
              <p className="mt-2 text-base font-semibold leading-snug text-white">
                {report.nextActions[0].title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                {report.nextActions[0].instruction}
              </p>
            </div>
          ) : null}
        </article>

        {/* 2 — Le schéma : où l'entretien a basculé */}
        <Panel
          title="Chronologie de votre appel"
          description="Chaque repère est placé à l'horodatage où il s'est réellement produit pendant l'appel."
        >
          {/* Le composant gère lui-même son défilement horizontal. */}
          <CallTimeline
            moments={report.keyMoments}
            missed={report.missedOpportunities}
            durationSeconds={report.session.durationSeconds}
          />
          <CallTimelineLegend types={report.keyMoments.map((moment) => moment.type)} />
        </Panel>

        {/* 3 — Le plan, tel que le Coach l'a formulé */}
        <Panel
          title="Votre plan en trois gestes"
          description="Formulé par le Coach à partir de cet entretien, dans l'ordre à travailler."
        >
          <ol className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {report.nextActions.map((action, index) => (
              <li
                key={`${action.title}-${index}`}
                className={cx(
                  "flex flex-col rounded-md p-4",
                  index === 0 ? "border border-brand-sky bg-brand-soft" : "bg-mist/70",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-xs bg-brand text-xs font-semibold tabular-nums text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-semibold leading-snug text-ink">{action.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{action.instruction}</p>
              </li>
            ))}
          </ol>
        </Panel>

        {/* 4 — Ce qui s'est joué, moment par moment */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel
            title="Ce qu'il faut changer"
            description="Les écarts relevés par le Coach, rattachés à leur moment dans l'appel."
            className="lg:col-span-7"
          >
            <ul className="space-y-3">
              {report.improvements.map((item, index) => (
                <li
                  key={`${item.title}-${index}`}
                  className="rounded-md bg-mist/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <CircleAlert size={15} className="shrink-0 text-warning" aria-hidden />
                    <span className="text-sm font-semibold leading-snug text-ink">{item.title}</span>
                    {item.timestampSeconds !== null ? (
                      <span className="font-mono text-xs font-semibold tabular-nums text-muted">
                        {formatTimer(item.timestampSeconds)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-graphite">{item.explanation}</p>
                </li>
              ))}
            </ul>

            {alerts.length > 0 ? (
              <div className="mt-5 border-t border-line pt-4">
                <p className="nm-label">Moments de bascule à revoir</p>
                <ul className="mt-3 space-y-2">
                  {alerts.map((moment, index) => (
                    <li
                      key={`${moment.timestampSeconds}-${index}`}
                      className="flex gap-3 text-sm leading-relaxed text-graphite"
                    >
                      <span className="shrink-0 font-mono font-semibold tabular-nums text-ink">
                        {formatTimer(moment.timestampSeconds)}
                      </span>
                      <span>
                        <span className="font-medium text-ink">{moment.title}</span> —{" "}
                        {moment.explanation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>

          {/*
            Les extraits ne sont montrés que pour la compétence prioritaire :
            c'est le seul rattachement déclaré par le Coach. Associer un extrait
            à un axe d'amélioration par proximité d'horodatage reviendrait à
            inventer un lien que l'analyse n'établit pas.
          */}
          <Panel
            title="Ce que vous avez réellement dit"
            description={`Extraits retenus par le Coach pour « ${priority.label.toLowerCase()} ».`}
            className="lg:col-span-5"
          >
            {priorityCompetency && priorityCompetency.evidence.length > 0 ? (
              <>
                <p className="flex gap-3 rounded-md bg-mist/70 p-4 text-sm leading-relaxed text-graphite">
                  <Quote size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden />
                  {priorityCompetency.observation}
                </p>
                <EvidenceList evidence={priorityCompetency.evidence} />
              </>
            ) : (
              /*
                Sans extrait, le bloc restait une phrase d'excuse et le
                commercial ne voyait jamais à quoi cette fiche ressemble. On
                montre donc un exemple, explicitement marqué comme tel, pour
                que la mise en forme attendue soit lisible dès la première
                simulation.
              */
              <>
                <p className="rounded-md bg-warning-soft px-4 py-3 text-sm leading-relaxed text-graphite">
                  Le Coach n&apos;a retenu aucun extrait pour cette compétence sur cet appel : elle
                  n&apos;a pas pu être observée assez longtemps. Voici à quoi ressemblera ce bloc
                  dès qu&apos;un échange en fournira.
                </p>
                <div className="mt-4 rounded-md border border-dashed border-line-strong p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <DemoBadge>Exemple — pas votre appel</DemoBadge>
                  </div>
                  <p className="mt-3 flex gap-3 text-sm leading-relaxed text-graphite">
                    <Quote size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                    La remise arrive onze secondes après l&apos;objection, avant toute question de
                    compréhension.
                  </p>
                  <EvidenceList evidence={EXAMPLE_EVIDENCE} />
                </div>
              </>
            )}
          </Panel>
        </div>

        {/* 5 — Occasions manquées et effet sur Julie */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Panel
            title="Occasions manquées"
            description="Des ouvertures que Julie a laissées et qui n'ont pas été saisies."
            className="lg:col-span-7"
          >
            {report.missedOpportunities.length === 0 ? (
              <p className="text-sm leading-relaxed text-graphite">
                Aucune occasion manquée n&apos;a été relevée sur cet échange.
              </p>
            ) : (
              <ul className="space-y-3">
                {report.missedOpportunities.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="rounded-md bg-warning-soft p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold leading-snug text-ink">
                        {item.title}
                      </span>
                      {item.timestampSeconds !== null ? (
                        <span className="font-mono text-xs font-semibold tabular-nums text-warning">
                          {formatTimer(item.timestampSeconds)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">{item.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <CoachPsychologicalPanel report={report} className="lg:col-span-5" />
        </div>

        {/* 6 — Ce qui marche déjà, à conserver : en fin de page, pas en tête */}
        <Panel
          title="À conserver"
          description="Ce qui a fonctionné et qu'il ne faut pas perdre en corrigeant le reste."
        >
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {report.strengths.map((item, index) => (
              <li key={`${item.title}-${index}`} className="rounded-md bg-positive-soft p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="shrink-0 text-positive" aria-hidden />
                  {item.timestampSeconds !== null ? (
                    <span className="font-mono text-xs font-semibold tabular-nums text-positive">
                      {formatTimer(item.timestampSeconds)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug text-ink">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-graphite">{item.explanation}</p>
              </li>
            ))}
          </ul>
        </Panel>

        {/* 7 — Reprise immédiate */}
        <div className="nm-card flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-base font-semibold text-ink">
              <Target size={17} className="shrink-0 text-brand" aria-hidden />
              Rejouer un entretien centré sur « {priority.label.toLowerCase()} »
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-graphite">
              Sélectionnez cet objectif au lancement : le Coach concentrera l&apos;analyse dessus.
            </p>
          </div>
          <ButtonLink href="/commercial/nouvelle-simulation">
            Nouvelle simulation
            <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        </div>

        <CoachTranscriptPanel report={report} />

        <CoachLimitationsPanel report={report} />
        <CoachDisclaimer variant="commercial" />
      </div>
    </>
  );
}
