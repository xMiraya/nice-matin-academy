"use client";

import { CheckCircle2, Circle, Lock, LockOpen, RotateCw, TriangleAlert } from "lucide-react";
import { Panel } from "@/src/components/Panel";
import { Badge } from "@/src/components/StatusBadge";
import { Button, ButtonLink } from "@/src/components/Button";
import { qcmRoutes } from "@/src/data/qcm/routes";
import type { JulieAccess, RequirementStatus } from "@/src/lib/access/julie-access";
import type { LevelId } from "@/src/types/qcm/quiz";
import type { CompetencyId } from "@/src/types/qcm/competency";

/** Lien vers le QCM ou l'évaluation concernés. */
function hrefFor(requirement: RequirementStatus): string {
  if (requirement.type === "ASSESSMENT") {
    const level = Number(requirement.targetId.replace(/\D/g, "")) as LevelId;
    return level >= 1 && level <= 5 ? qcmRoutes.assessmentFor(level) : qcmRoutes.assessments;
  }
  return qcmRoutes.trainingFor(requirement.targetId as CompetencyId);
}

function RequirementRow({ requirement }: { requirement: RequirementStatus }) {
  const Icon = requirement.passed ? CheckCircle2 : Circle;
  const best = requirement.bestScore === null ? null : Math.floor(requirement.bestScore);
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-mist/70 px-4 py-3">
      <span className="flex min-w-0 items-start gap-3">
        <Icon
          size={18}
          aria-hidden
          className={requirement.passed ? "mt-0.5 shrink-0 text-positive" : "mt-0.5 shrink-0 text-muted"}
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-ink">{requirement.title}</span>
          <span className="block text-xs text-graphite">
            {!requirement.completed
              ? `Pas encore terminé · score requis : ${requirement.requiredScore}/100`
              : requirement.passed
                ? `Validé · meilleur résultat : ${best}/100`
                : `Votre meilleur résultat : ${best}/100 · score requis : ${requirement.requiredScore}/100`}
          </span>
        </span>
      </span>
      {requirement.passed ? (
        <Badge tone="positif">Validé</Badge>
      ) : (
        <ButtonLink href={hrefFor(requirement)} size="sm" variant="secondary">
          {requirement.completed ? "Retenter" : requirement.type === "ASSESSMENT" ? "Passer l’évaluation" : "Passer le QCM"}
        </ButtonLink>
      )}
    </li>
  );
}

interface Props {
  state: { status: "loading" } | { status: "error" } | { status: "ready"; access: JulieAccess };
  onRetry: () => void;
}

/** Carte « Simulation avec Julie » : verrouillée, déverrouillée, en chargement ou en erreur. */
export function JulieAccessPanel({ state, onRetry }: Props) {
  if (state.status === "loading") {
    return (
      <Panel title="Simulation avec Julie">
        <p role="status" className="text-sm text-graphite">
          Vérification de vos prérequis…
        </p>
      </Panel>
    );
  }

  if (state.status === "error") {
    return (
      <Panel title="Simulation avec Julie">
        <p role="alert" className="flex items-center gap-2 text-sm font-medium text-danger">
          <TriangleAlert size={16} aria-hidden />
          Vos prérequis n’ont pas pu être vérifiés. Le lancement reste bloqué par prudence.
        </p>
        <Button className="mt-3" size="sm" variant="secondary" onClick={onRetry}>
          <RotateCw size={14} aria-hidden />
          Réessayer
        </Button>
      </Panel>
    );
  }

  const { access } = state;

  if (access.eligible) {
    return (
      <Panel
        title="Simulation avec Julie"
        action={
          <Badge tone="positif" dot>
            Débloquée
          </Badge>
        }
      >
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
          <LockOpen size={17} aria-hidden className="mt-0.5 shrink-0 text-positive" />
          {access.message}
        </p>
        {access.viaOverride && access.override ? (
          <p className="mt-2 text-xs text-graphite">
            Accès accordé à titre exceptionnel par votre manager
            {access.override.expiresAt
              ? `, jusqu’au ${new Date(access.override.expiresAt).toLocaleDateString("fr-FR")}`
              : ""}
            .
          </p>
        ) : null}
      </Panel>
    );
  }

  return (
    <Panel
      title="Simulation avec Julie"
      action={
        <Badge tone="vigilance">
          <Lock size={12} aria-hidden /> Verrouillée
        </Badge>
      }
    >
      <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink">
        <Lock size={17} aria-hidden className="mt-0.5 shrink-0 text-brand" />
        Obtenez au moins {access.requiredScore}/100 à chaque QCM et évaluation obligatoire pour accéder à
        l’entraînement avec Julie.
      </p>
      {access.totalCount > 0 ? (
        <>
          <p className="mt-3 text-sm font-semibold text-ink">
            {access.passedCount} prérequis validé{access.passedCount > 1 ? "s" : ""} sur {access.totalCount}
          </p>
          <ul className="mt-3 space-y-2">
            {access.requirements.map((requirement) => (
              <RequirementRow key={`${requirement.type}:${requirement.targetId}`} requirement={requirement} />
            ))}
          </ul>
        </>
      ) : null}
    </Panel>
  );
}
