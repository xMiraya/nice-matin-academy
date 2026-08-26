"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { CoachMascot } from "@/src/components/coach/CoachMascot";
import { ProcessingSteps } from "@/src/components/ProcessingSteps";
import type { ProcessingStep, ProcessingStepStatus } from "@/src/components/ProcessingSteps";
import { Button, ButtonLink } from "@/src/components/Button";
import { Badge } from "@/src/components/StatusBadge";
import { DEMO_COMMERCIAL_PROFILE } from "@/src/data/demo-commercial";
import { OBJECTIVES } from "@/src/data/competencies";
import { reportRepository } from "@/src/lib/reports/report-repository";
import {
  readLastConversationId,
  readSelectedObjectiveIds,
  storeLastReportId,
} from "@/src/lib/session-storage";
import type {
  CoachAnalysisResponse,
  CoachApiError,
  CoachPendingResponse,
  CoachReport,
} from "@/src/types/coach";

/** Conversation de validation, utilisable en développement uniquement. */
const TEST_CONVERSATION_ID = "cde62008bda0542f";

const POLL_INTERVAL_MS = 5_000;
const MAX_ATTEMPTS = 12;

const isDevelopment = process.env.NODE_ENV !== "production";

const STEPS: ProcessingStep[] = [
  {
    id: "conversation",
    label: "Récupération de la conversation",
    detail: "Lecture de la session auprès de Tavus.",
  },
  {
    id: "transcript",
    label: "Préparation du transcript",
    detail: "Filtrage des tours de parole réellement échangés.",
  },
  {
    id: "coach",
    label: "Analyse par le Coach IA",
    detail: "Évaluation des huit compétences commerciales.",
  },
  {
    id: "report",
    label: "Construction du compte rendu",
    detail: "Calcul de la note pondérée et mise en forme.",
  },
  {
    id: "ready",
    label: "Compte rendu prêt",
    detail: "Ouverture de votre analyse détaillée.",
  },
];

type Phase =
  | "idle"
  | "fetching"
  | "waiting_call_end"
  | "waiting_transcript"
  | "analyzing"
  | "saving"
  | "done"
  | "error";

/**
 * Statuts déduits uniquement de ce que le serveur a réellement confirmé.
 * Aucune étape n'est marquée terminée tant qu'elle ne l'est pas.
 */
function stepStatuses(phase: Phase): ProcessingStepStatus[] {
  switch (phase) {
    case "fetching":
    case "waiting_call_end":
      return ["active", "pending", "pending", "pending", "pending"];
    case "waiting_transcript":
      return ["done", "active", "pending", "pending", "pending"];
    case "analyzing":
      return ["done", "done", "active", "pending", "pending"];
    case "saving":
      return ["done", "done", "done", "active", "pending"];
    case "done":
      return ["done", "done", "done", "done", "done"];
    default:
      return ["pending", "pending", "pending", "pending", "pending"];
  }
}

const PHASE_MESSAGES: Partial<Record<Phase, string>> = {
  fetching: "Connexion à la conversation en cours…",
  waiting_call_end: "L'appel est encore ouvert. L'analyse démarrera dès sa clôture.",
  waiting_transcript: "Tavus prépare le transcript de l'échange.",
  analyzing: "Le Coach IA évalue l'entretien. Cette étape prend généralement moins d'une minute.",
  saving: "Mise en forme de votre compte rendu.",
  done: "Compte rendu prêt.",
};

/* ------------------------------------------------------------------ */
/* Logique d'analyse, hors composant                                   */
/* ------------------------------------------------------------------ */

interface PerformAnalysisOptions {
  conversationId: string;
  isCancelled: () => boolean;
  registerController: (controller: AbortController) => void;
  setPhase: (phase: Phase) => void;
  onError: (message: string) => void;
  onSuccess: (report: CoachReport) => void;
}

/**
 * Interroge la route d'analyse jusqu'à obtenir un compte rendu.
 * Les réponses 202 déclenchent une nouvelle tentative, dans la limite fixée.
 */
async function performAnalysis(options: PerformAnalysisOptions): Promise<void> {
  const objectiveIds = readSelectedObjectiveIds();
  const objectiveLabels = OBJECTIVES.filter((objective) =>
    objectiveIds.includes(objective.id),
  ).map((objective) => objective.label);

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      if (options.isCancelled()) return;

      const controller = new AbortController();
      options.registerController(controller);

      const response = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: options.conversationId,
          selectedObjectiveIds: objectiveIds,
          selectedObjectiveLabels: objectiveLabels,
          commercial: {
            id: DEMO_COMMERCIAL_PROFILE.slug,
            name: `${DEMO_COMMERCIAL_PROFILE.firstName} ${DEMO_COMMERCIAL_PROFILE.lastName}`,
          },
        }),
        signal: controller.signal,
      });

      if (options.isCancelled()) return;

      // 202 : conversation encore active ou transcript pas encore prêt.
      if (response.status === 202) {
        const pending = (await response.json()) as CoachPendingResponse;
        options.setPhase(
          pending.status === "waiting_for_call_end" ? "waiting_call_end" : "waiting_transcript",
        );

        if (attempt === MAX_ATTEMPTS) {
          options.onError(
            "Le transcript n'est toujours pas disponible après plusieurs tentatives. Réessayez dans quelques instants.",
          );
          return;
        }

        const delay = pending.retryAfterSeconds > 0
          ? pending.retryAfterSeconds * 1000
          : POLL_INTERVAL_MS;
        await sleep(delay);

        if (options.isCancelled()) return;
        // Le transcript est désormais confirmé : la tentative suivante analyse.
        options.setPhase("analyzing");
        continue;
      }

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as CoachApiError | null;
        options.onError(describeError(response.status, failure));
        return;
      }

      const payload = (await response.json()) as CoachAnalysisResponse;
      options.onSuccess(payload.report);
      return;
    }
  } catch (error) {
    if (options.isCancelled() || (error as Error)?.name === "AbortError") return;
    options.onError(
      "La connexion au service d'analyse a échoué. Vérifiez votre réseau puis réessayez.",
    );
  }
}

/* ------------------------------------------------------------------ */
/* Composant                                                           */
/* ------------------------------------------------------------------ */

export function AnalysisProgress() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Garde-fous : une seule analyse à la fois, arrêt net si la page est quittée.
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const startedRef = useRef(false);

  const launch = (targetConversationId: string) => {
    if (runningRef.current) return;
    runningRef.current = true;
    cancelledRef.current = false;

    setConversationId(targetConversationId);
    setErrorMessage(null);
    setPhase("fetching");

    void performAnalysis({
      conversationId: targetConversationId,
      isCancelled: () => cancelledRef.current,
      registerController: (controller) => {
        abortRef.current = controller;
      },
      setPhase,
      onError: (message) => {
        setErrorMessage(message);
        setPhase("error");
      },
      onSuccess: (report) => {
        setPhase("saving");
        // Enregistrement via la couche dédiée, jamais localStorage en direct.
        reportRepository.saveReport(report);
        storeLastReportId(report.reportId);
        setPhase("done");
        router.push(`/commercial/simulations/${report.reportId}`);
      },
    }).finally(() => {
      runningRef.current = false;
    });
  };

  // Référence toujours à jour, pour un démarrage automatique sans dépendance instable.
  const launchRef = useRef(launch);
  useEffect(() => {
    launchRef.current = launch;
  });

  // Démarrage automatique : différé d'un tour de boucle pour ne déclencher
  // aucune mise à jour d'état synchrone depuis le corps de l'effet.
  useEffect(() => {
    cancelledRef.current = false;

    let timer: number | undefined;
    const storedId = readLastConversationId();

    if (storedId && !startedRef.current) {
      startedRef.current = true;
      timer = window.setTimeout(() => launchRef.current(storedId), 0);
    }

    return () => {
      cancelledRef.current = true;
      abortRef.current?.abort();
      if (timer !== undefined) window.clearTimeout(timer);
      // Réinitialisé pour qu'un remontage puisse relancer une analyse interrompue.
      startedRef.current = false;
    };
  }, []);

  return (
    <div className="nm-card p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <CoachMascot size="md" variant="analysis" animated className="mt-0.5" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {phase === "error"
              ? "L'analyse n'a pas pu aboutir"
              : "Votre entretien est en cours d'analyse"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-graphite">
            Le Coach IA relit l&apos;échange et prépare votre compte rendu. Cette étape ne demande
            aucune action de votre part.
          </p>
        </div>
      </div>

      {phase === "error" ? (
        <div className="mt-8">
          <div className="flex gap-3 rounded-md border border-danger/30 bg-danger/5 p-4">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-danger" aria-hidden />
            <p className="text-sm leading-relaxed text-graphite">
              {errorMessage ?? "Une erreur est survenue pendant l'analyse."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {conversationId ? (
              <Button onClick={() => launch(conversationId)}>
                <RotateCcw size={16} aria-hidden />
                Réessayer
              </Button>
            ) : null}
            <ButtonLink href="/commercial/simulations" variant="secondary">
              Retour aux simulations
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <ProcessingSteps
            steps={STEPS}
            statuses={stepStatuses(phase)}
            statusMessage={PHASE_MESSAGES[phase]}
          />
        </div>
      )}

      {/* Aucune simulation récente : sortie claire, plus outils de développement. */}
      {phase === "idle" ? (
        <div className="mt-8 border-t border-line pt-6">
          <p className="text-sm leading-relaxed text-graphite">
            Aucune simulation récente n&apos;a été détectée sur cet appareil. Lancez une simulation
            pour obtenir une analyse.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href="/commercial/nouvelle-simulation">Lancer une simulation</ButtonLink>
            {isDevelopment ? (
              <Button variant="secondary" onClick={() => launch(TEST_CONVERSATION_ID)}>
                Analyser la conversation test
              </Button>
            ) : null}
          </div>
          {isDevelopment ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-graphite">
              <Badge>Développement</Badge>
              Ce bouton n&apos;apparaît pas dans un build de production.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Relance manuelle, réservée au développement. */}
      {isDevelopment && phase === "done" && conversationId ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Badge>Développement</Badge>
          <Button variant="secondary" onClick={() => launch(conversationId)}>
            <RotateCcw size={15} aria-hidden />
            Relancer l&apos;analyse
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeError(status: number, failure: CoachApiError | null): string {
  if (failure?.code === "TAVUS_CREDITS_EXHAUSTED") {
    return "Le compte Tavus n'a plus de crédits disponibles. L'analyse redeviendra possible une fois le compte rechargé.";
  }

  switch (status) {
    case 400:
      return "La demande d'analyse est invalide. Relancez une simulation depuis la page de préparation.";
    case 401:
      return "Le service d'analyse n'est pas configuré sur ce serveur.";
    case 404:
      return "Cette conversation est introuvable. Elle a peut-être expiré côté Tavus.";
    case 409:
      return "Une analyse est déjà en cours pour cette conversation. Patientez quelques secondes.";
    case 429:
      return "Le service d'analyse est temporairement saturé. Réessayez dans un instant.";
    default:
      return failure?.error ?? "L'analyse n'a pas pu être produite pour le moment.";
  }
}
