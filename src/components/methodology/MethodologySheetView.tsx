"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock3, Quote } from "lucide-react";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { MethodologyChecklist } from "@/src/components/methodology/MethodologyChecklist";
import { PrintSheetButton } from "@/src/components/methodology/PrintSheetButton";
import { VALIDATION_LABEL, type MethodologySheet } from "@/src/types/methodology";
import { useEffectiveSheet } from "@/src/lib/content/use-effective-content";
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

export function MethodologySheetView({ sheet: baseSheet, previous, next }: MethodologySheetViewProps) {
  // Fusionne, si elle existe, la version publiée par le manager : le contenu
  // statique reste la référence côté serveur, la surcouche s'applique après
  // hydratation.
  const sheet = useEffectiveSheet(baseSheet);
  const needsValidation =
    sheet.validationStatus === "a-valider" || sheet.trainerTip.validationStatus === "a-valider";

  return (
    <article>
      {/* ------------------------------ En-tête ------------------------------ */}
      <header className="nm-card nm-navy relative mb-6 overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
        {/*
          Photographie de la compétence, posée sous le titre. Le voile marine
          reste opaque à gauche, là où le texte se trouve, et s'ouvre vers la
          droite où la photographie a été cadrée avec de l'espace libre.
        */}
        <Image
          src={`/images/fiches/${sheet.slug}.jpg`}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 960px, 100vw"
          className="pointer-events-none select-none object-cover object-right"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-brand-dark/60"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 font-mono text-base font-semibold tabular-nums text-white/90"
            >
              {String(sheet.number).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="nm-label mb-2 text-white/60">
                Compétence {sheet.number} sur 8, fiche méthodologique
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
          <span className="text-muted">Objectif : </span>
          {sheet.objective}
        </span>
        <span className="text-muted">Mise à jour : {formatDate(sheet.updatedAt)}</span>
        <Badge tone={needsValidation ? "vigilance" : "positif"}>
          {needsValidation ? VALIDATION_LABEL : "Contenu validé par l’équipe formation"}
        </Badge>
      </div>

      {/*
        Deux colonnes indépendantes plutôt qu'une grille : dans une grille, la
        hauteur d'une rangée est celle de son bloc le plus haut, ce qui creusait
        un trou sous chaque bloc court. Ici chaque colonne empile ses propres
        cartes et se remplit à son rythme. La colonne large accueille les blocs
        tabulaires (méthode, situation terrain, indicateur), la colonne étroite
        les listes.
      */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5">
          <Panel title="Enjeu de la compétence" action={<BlockIndex value={1} />}>
            <Bullets items={sheet.stakes} />
          </Panel>

          <Panel title="Les bons réflexes" action={<BlockIndex value={3} />}>
            <Bullets items={sheet.goodReflexes} tone="positif" />
          </Panel>

          <Panel title="À éviter" action={<BlockIndex value={5} />}>
            <Bullets items={sheet.phrasesToAvoid} tone="critique" />
          </Panel>

          <Panel title="Questions utiles" action={<BlockIndex value={7} />}>
            <Bullets items={sheet.usefulQuestions} />
          </Panel>

          <Panel title="Checklist avant de poursuivre" action={<BlockIndex value={9} />}>
            <MethodologyChecklist items={sheet.checklist} />
          </Panel>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <Panel title="Méthode en quatre étapes" action={<BlockIndex value={2} />}>
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

          <Panel title="À dire" action={<BlockIndex value={4} />}>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

          <Panel title="Situation terrain" action={<BlockIndex value={6} />}>
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
                  <dd className="mt-2 whitespace-pre-line text-sm leading-relaxed text-graphite">
                    {sheet.fieldScenario[row.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel
            title="Indicateur de maîtrise"
            description="Trois niveaux décrits par des comportements observables, sans note."
            action={<BlockIndex value={8} />}
          >
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {sheet.masteryLevels.map((level, position) => (
                <div key={level.name} className="rounded-sm border border-line bg-mist/60 p-4">
                  <dt>
                    <span className="nm-label">Niveau {position + 1}</span>
                    <span className="mt-1.5 block text-sm font-semibold text-ink">
                      {level.name}
                    </span>
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-graphite">{level.behaviour}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          {/*
            Le conseil du formateur ferme la colonne large : il équilibre les
            deux piles et occupe toute sa largeur, alors qu'en colonne étroite
            il laissait une bande vide à sa droite.
          */}
          <Panel title="Conseil du formateur" action={<BlockIndex value={10} />}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="min-w-0 flex-1 whitespace-pre-line text-[15px] leading-relaxed text-graphite">
                {sheet.trainerTip.text}
              </p>
              {sheet.trainerTip.validationStatus === "a-valider" ? (
                <Badge tone="vigilance">{VALIDATION_LABEL}</Badge>
              ) : null}
            </div>
          </Panel>
        </div>
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
            className="nm-card-link group flex items-center gap-3 p-4 sm:p-5"
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
        {/*
          La fiche suivante est le seul vrai appel à l'action de la page : elle
          est traitée comme un bouton plein, pour qu'on la distingue au premier
          coup d'œil des dix blocs de contenu, qui ne sont pas cliquables.
        */}
        {next ? (
          <Link
            href={`/commercial/fiches/${next.slug}`}
            rel="next"
            className="nm-navy group flex items-center justify-end gap-4 rounded-lg p-4 text-right shadow-lift transition-shadow hover:shadow-lg sm:col-start-2 sm:p-5"
          >
            <span className="min-w-0">
              <span className="nm-label text-white/60">Fiche suivante</span>
              <span className="mt-1 block truncate text-base font-semibold text-white">
                {next.number}. {next.title}
              </span>
            </span>
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition-transform group-hover:translate-x-0.5"
            >
              <ChevronRight size={20} />
            </span>
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
