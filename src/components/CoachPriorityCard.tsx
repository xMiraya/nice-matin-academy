import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import type { CoachPriority } from "@/src/types";
import { getCompetencyLabel } from "@/src/data/competencies";
import { CoachMascot } from "@/src/components/coach/CoachMascot";
import { cx } from "@/src/lib/format";

interface CoachPriorityCardProps {
  priority: CoachPriority;
  /** Numéro d'ordre affiché à gauche, si la carte fait partie d'une liste. */
  index?: number;
  accent?: boolean;
  actionHref?: string;
  actionLabel?: string;
  /** Affiche la mascotte du Coach en petit format, en tête de carte. */
  showMascot?: boolean;
  className?: string;
}

/** Recommandation du Coach IA : diagnostic puis action concrète. */
export function CoachPriorityCard({
  priority,
  index,
  accent = false,
  actionHref,
  actionLabel = "Commencer une simulation",
  showMascot = false,
  className,
}: CoachPriorityCardProps) {
  return (
    <article
      className={cx(
        "flex h-full flex-col p-5",
        accent
          ? "rounded-lg border border-brand-sky bg-brand-soft"
          : "nm-card",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        {showMascot ? (
          <CoachMascot size="sm" />
        ) : index !== undefined ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-brand text-xs font-semibold tabular-nums text-white">
            {index}
          </span>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-xs bg-white text-brand">
            <Target size={15} aria-hidden />
          </span>
        )}
        <span className="nm-label text-brand-mid">
          {getCompetencyLabel(priority.competencyId)}
        </span>
      </div>

      <h3 className="mt-3.5 text-base font-semibold leading-snug tracking-tight text-ink">
        {priority.title}
      </h3>

      <p className="mt-2.5 text-sm leading-relaxed text-graphite">{priority.diagnostic}</p>

      <div
        className={cx(
          "mt-4 rounded-md p-3.5",
          accent ? "bg-white/70" : "bg-mist",
        )}
      >
        <p className="nm-label">Action proposée</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">{priority.action}</p>
      </div>

      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-sm bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-accent"
        >
          {actionLabel}
          <ArrowRight size={15} aria-hidden />
        </Link>
      ) : null}
    </article>
  );
}

interface CoachFocusHeroProps {
  priority: CoachPriority;
  /** Score actuel de la compétence visée, si connu. */
  score?: number | null;
  actionHref: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Précise l'origine du diagnostic : analyses réelles ou démonstration. */
  sourceNote?: string;
  /** Nature de l'encart, au-dessus du nom de la compétence. */
  eyebrow?: string;
  /** Intitulé du bloc d'action, en bas de la carte. */
  actionTitle?: string;
  /** La mascotte n'a de sens que lorsque le Coach IA est l'auteur du conseil. */
  showMascot?: boolean;
  className?: string;
}

/**
 * Carte d'ouverture du tableau de bord commercial.
 *
 * Elle répond à la seule question qui compte à l'ouverture : que dois-je
 * travailler maintenant, et comment. Tout le reste de la page sert à justifier
 * ou à nuancer cette recommandation.
 */
export function CoachFocusHero({
  priority,
  score,
  actionHref,
  actionLabel = "Lancer la simulation",
  secondaryHref,
  secondaryLabel = "Choisir un autre objectif",
  sourceNote,
  eyebrow = "Recommandation du Coach IA",
  actionTitle = "Votre consigne pour le prochain appel",
  showMascot = true,
  className,
}: CoachFocusHeroProps) {
  return (
    <article
      className={cx(
        "nm-navy relative flex h-full flex-col overflow-hidden rounded-lg p-6 shadow-lift sm:p-7",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-sky/15 blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-brand-accent/25 blur-2xl"
      />

      <div className="relative flex flex-wrap items-center gap-3">
        {showMascot ? (
          <CoachMascot size="sm" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 bg-white/10 text-brand-sky">
            <Target size={18} aria-hidden />
          </span>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-sky">
            {eyebrow}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {getCompetencyLabel(priority.competencyId)}
            {typeof score === "number" ? (
              <span className="text-white/60"> — {score} / 100</span>
            ) : null}
          </p>
        </div>
      </div>

      <h2 className="nm-display relative mt-5 max-w-xl text-[1.375rem] leading-snug text-white sm:text-2xl">
        {priority.title}
      </h2>

      <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
        {priority.diagnostic}
      </p>

      <div className="relative mt-5 rounded-md border border-white/12 bg-white/8 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-sky">
          {actionTitle}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-white">{priority.action}</p>
      </div>

      <div className="relative mt-auto flex flex-wrap items-center gap-3 pt-6">
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 rounded-sm bg-white px-4.5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-sky"
        >
          {actionLabel}
          <ArrowRight size={15} aria-hidden />
        </Link>
        {secondaryHref ? (
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 rounded-sm border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {secondaryLabel}
          </Link>
        ) : null}
        {sourceNote ? (
          <span className="text-xs text-white/60">{sourceNote}</span>
        ) : null}
      </div>
    </article>
  );
}
