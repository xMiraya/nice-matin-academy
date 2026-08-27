import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3, Quote } from "lucide-react";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { MethodologyChecklist } from "@/src/components/methodology/MethodologyChecklist";
import { PrintSheetButton } from "@/src/components/methodology/PrintSheetButton";
import { VALIDATION_LABEL, type MethodologySheet } from "@/src/types/methodology";
import { cx, formatDate } from "@/src/lib/format";

interface MethodologySheetViewProps {
  sheet: MethodologySheet;
  previous: MethodologySheet | null;
  next: MethodologySheet | null;
}

/** Micro-libellé numéroté commun aux dix blocs de la fiche. */
function BlockIndex({ value }: { value: number }) {
  return <span className="nm-label">Bloc {String(value).padStart(2, "0")}</span>;
}

const BULLET_TONES = {
  neutre: "bg-line-strong",
  positif: "bg-positive-bright",
  critique: "bg-danger-bright",
} as const;

/** Liste à puces sobre, réutilisée par la moitié des blocs. */
function Bullets({
  items,
  tone = "neutre",
}: {
  items: readonly string[];
  tone?: keyof typeof BULLET_TONES;
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-graphite">
          <span
            aria-hidden
            className={cx("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", BULLET_TONES[tone])}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const SCENARIO_TONES = {
  neutre: "border-line bg-mist/60",
  critique: "border-danger-bright/20 bg-danger-soft",
  positif: "border-positive-bright/25 bg-positive-soft",
} as const;

const SCENARIO_ROWS = [
  { term: "Contexte", key: "context", tone: "neutre" },
  { term: "Le prospect", key: "prospectReaction", tone: "neutre" },
  { term: "Mauvaise réponse", key: "poorResponse", tone: "critique" },
  { term: "Meilleure réaction", key: "betterResponse", tone: "positif" },
  { term: "Pourquoi", key: "why", tone: "neutre" },
] as const satisfies readonly {
  term: string;
  key: keyof MethodologySheet["fieldScenario"];
  tone: keyof typeof SCENARIO_TONES;
}[];

export function MethodologySheetView({ sheet, previous, next }: MethodologySheetViewProps) {
  const needsValidation =
    sheet.validationStatus === "a-valider" || sheet.trainerTip.validationStatus === "a-valider";

  return (
    <article>
      {/* ------------------------------ En-tête ------------------------------ */}
      <header className="nm-card nm-navy mb-6 overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 font-mono text-base font-semibold tabular-nums text-white/90"
            >
              {String(sheet.number).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="nm-label mb-2 text-white/60">
                Compétence {sheet.number} sur 8 — Fiche méthodologique
              </p>
              <h1 className="nm-display text-[1.75rem] leading-[1.15] text-white sm:text-[2.125rem]">
                {sheet.title}
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-brand-sky sm:text-[15px]">
                {sheet.definition}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80">
              <Clock3 size={13} aria-hidden />
              {sheet.readingMinutes} min de lecture
            </span>
            <PrintSheetButton />
          </div>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-graphite">
        <span>
          <span className="text-muted">Objectif — </span>
          {sheet.objective}
        </span>
        <span className="text-muted">Mise à jour : {formatDate(sheet.updatedAt)}</span>
        <Badge tone={needsValidation ? "vigilance" : "positif"}>
          {needsValidation ? VALIDATION_LABEL : "Contenu validé par l’équipe formation"}
        </Badge>
      </div>

      {/*
        Grille volontairement non uniforme : la méthode, la situation terrain et
        l'indicateur de maîtrise occupent deux colonnes, les blocs courts une.
      */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title="Enjeu de la compétence" action={<BlockIndex value={1} />}>
          <Bullets items={sheet.stakes} />
        </Panel>

        <Panel
          title="Méthode en quatre étapes"
          action={<BlockIndex value={2} />}
          className="lg:col-span-2"
        >
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sheet.methodSteps.map((step) => (
              <li key={step.order} className="rounded-sm border border-line bg-mist/60 p-4">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="flex h-6 w-6 items-center justify-center rounded-xs bg-brand text-xs font-semibold tabular-nums text-white"
                  >
                    {step.order}
                  </span>
                  <span className="nm-label">{step.phase}</span>
                </div>
                <p className="mt-2.5 text-sm font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-graphite">{step.detail}</p>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Les bons réflexes" action={<BlockIndex value={3} />}>
          <Bullets items={sheet.goodReflexes} tone="positif" />
        </Panel>

        <Panel title="À dire" action={<BlockIndex value={4} />}>
          <ul className="space-y-2.5">
            {sheet.phrasesToUse.map((phrase) => (
              <li
                key={phrase}
                className="flex gap-2.5 rounded-sm border border-brand-sky bg-brand-soft px-3.5 py-2.5"
              >
                <Quote size={14} aria-hidden className="mt-0.5 shrink-0 text-brand-accent" />
                <p className="text-sm leading-relaxed text-brand">« {phrase} »</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="À éviter" action={<BlockIndex value={5} />}>
          <Bullets items={sheet.phrasesToAvoid} tone="critique" />
        </Panel>

        <Panel title="Questions utiles" action={<BlockIndex value={6} />}>
          <Bullets items={sheet.usefulQuestions} />
        </Panel>

        <Panel title="Situation terrain" action={<BlockIndex value={7} />} className="lg:col-span-2">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SCENARIO_ROWS.map((row) => (
              <div
                key={row.key}
                className={cx(
                  "rounded-sm border p-4",
                  SCENARIO_TONES[row.tone],
                  row.key === "why" ? "sm:col-span-2" : undefined,
                )}
              >
                <dt className="nm-label">{row.term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-graphite">
                  {sheet.fieldScenario[row.key]}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Checklist avant de poursuivre" action={<BlockIndex value={8} />}>
          <MethodologyChecklist items={sheet.checklist} />
        </Panel>

        <Panel
          title="Indicateur de maîtrise"
          description="Trois niveaux décrits par des comportements observables, sans note."
          action={<BlockIndex value={9} />}
          className="lg:col-span-2"
        >
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {sheet.masteryLevels.map((level, position) => (
              <div key={level.name} className="rounded-sm border border-line bg-mist/60 p-4">
                <dt>
                  <span className="nm-label">Niveau {position + 1}</span>
                  <span className="mt-1.5 block text-sm font-semibold text-ink">{level.name}</span>
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-graphite">{level.behaviour}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Conseil du formateur" action={<BlockIndex value={10} />}>
          <p className="text-sm leading-relaxed text-graphite">{sheet.trainerTip.text}</p>
          {sheet.trainerTip.validationStatus === "a-valider" ? (
            <Badge tone="vigilance" className="mt-4">
              {VALIDATION_LABEL}
            </Badge>
          ) : null}
        </Panel>
      </div>

      {/* ----------------------------- Navigation ----------------------------- */}
      <nav
        aria-label="Navigation entre les fiches"
        data-print="hide"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {previous ? (
          <Link
            href={`/commercial/fiches/${previous.slug}`}
            rel="prev"
            className="nm-card group flex items-center gap-3 p-4 transition-shadow hover:shadow-lift"
          >
            <ChevronLeft size={18} aria-hidden className="shrink-0 text-muted" />
            <span className="min-w-0">
              <span className="nm-label">Fiche précédente</span>
              <span className="mt-1 block truncate text-sm font-semibold text-ink group-hover:text-brand">
                {previous.number}. {previous.title}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/commercial/fiches/${next.slug}`}
            rel="next"
            className="nm-card group flex items-center justify-end gap-3 p-4 text-right transition-shadow hover:shadow-lift sm:col-start-2"
          >
            <span className="min-w-0">
              <span className="nm-label">Fiche suivante</span>
              <span className="mt-1 block truncate text-sm font-semibold text-ink group-hover:text-brand">
                {next.number}. {next.title}
              </span>
            </span>
            <ChevronRight size={18} aria-hidden className="shrink-0 text-muted" />
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
