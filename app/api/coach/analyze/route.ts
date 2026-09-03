import { NextResponse } from "next/server";
import { z } from "zod";
import type { CoachAnalysisResponse, CoachApiError, CoachPendingResponse } from "@/src/types/coach";
import { getTavusConversation, isValidConversationId } from "@/src/lib/tavus/get-conversation";
import { OBJECTIVES } from "@/src/data/competencies";
import {
  analyzeConversation,
  buildCoachReport,
} from "@/src/lib/coach/analyze-conversation";

/**
 * POST /api/coach/analyze — déclenche l'analyse d'une simulation par le Coach IA.
 *
 * TODO sécurité : ajouter authentification, autorisation, limitation de débit et
 * stockage interne avant production. En l'état, la route est destinée à un
 * usage local de prototypage uniquement.
 *
 * Aucune clé, aucun prompt système et aucun payload fournisseur brut n'est
 * renvoyé au client.
 */

/** Taille maximale acceptée pour le corps de requête. */
const MAX_BODY_BYTES = 8_192;

const RequestSchema = z.object({
  conversationId: z.string().min(8).max(64),
  difficulty: z.enum(["facile", "intermediaire", "difficile"]).optional(),
  selectedObjectiveIds: z.array(z.string().max(64)).max(20),
  selectedObjectiveLabels: z.array(z.string().max(120)).max(20),
  commercial: z.object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(120),
  }),
});

/**
 * Analyses en cours dans ce processus, par conversationId.
 * Protection simple contre les doubles analyses simultanées : suffisante pour un
 * prototype mono-processus, à remplacer par un verrou partagé en production.
 */
const inFlightAnalyses = new Set<string>();

function pending(
  status: CoachPendingResponse["status"],
  message: string,
): NextResponse<CoachPendingResponse> {
  return NextResponse.json<CoachPendingResponse>(
    { status, message, retryAfterSeconds: 5 },
    { status: 202 },
  );
}

function failure(error: string, status: number, code?: string): NextResponse<CoachApiError> {
  return NextResponse.json<CoachApiError>(code ? { error, code } : { error }, { status });
}

export async function POST(request: Request) {
  // 1. Lecture bornée puis validation stricte du corps.
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return failure("Requête trop volumineuse.", 400);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return failure("Corps de requête invalide.", 400);
  }

  const validation = RequestSchema.safeParse(parsedJson);
  if (!validation.success) {
    return failure("Requête invalide.", 400);
  }

  const { conversationId, difficulty, selectedObjectiveIds, selectedObjectiveLabels, commercial } =
    validation.data;

  if (!isValidConversationId(conversationId)) {
    return failure("Identifiant de conversation invalide.", 400);
  }

  if (inFlightAnalyses.has(conversationId)) {
    return failure(
      "Une analyse est déjà en cours pour cette conversation.",
      409,
      "ANALYSIS_ALREADY_RUNNING",
    );
  }

  inFlightAnalyses.add(conversationId);
  try {
    // 2. Récupération de la conversation Tavus.
    const fetched = await getTavusConversation(conversationId);

    if (fetched.kind === "not_configured") {
      return failure("La configuration serveur est incomplète.", 401);
    }
    if (fetched.kind === "not_found") {
      return failure("Conversation introuvable.", 404);
    }
    if (fetched.kind === "credits_exhausted") {
      return failure(
        "Le compte Tavus n'a plus de crédits disponibles.",
        402,
        "TAVUS_CREDITS_EXHAUSTED",
      );
    }
    if (fetched.kind === "upstream_error") {
      return failure("Le service Tavus est momentanément indisponible.", 502);
    }

    const conversation = fetched.conversation;

    // 3. Attente : jamais d'appel OpenAI tant que le transcript n'est pas prêt.
    if (conversation.status === "active" && !conversation.hasShutdown) {
      return pending(
        "waiting_for_call_end",
        "L'appel est encore en cours. L'analyse démarrera dès sa clôture.",
      );
    }

    if (!conversation.transcriptReady || conversation.transcript.length === 0) {
      return pending(
        "waiting_for_transcript",
        "Le transcript est en cours de préparation par Tavus.",
      );
    }

    // 4. Appel du Coach sur des données déjà filtrées.
    const analysis = await analyzeConversation({
      transcript: conversation.transcript,
      perception: conversation.perception,
      durationSeconds: conversation.durationSeconds,
      shutdownReason: conversation.shutdownReason,
      selectedObjectiveLabels,
      commercialName: commercial.name,
      // Le niveau et la portée étaient reçus par la route puis conservés dans
      // les métadonnées du compte rendu, sans jamais atteindre le Coach.
      difficulty,
      isFullInterview: selectedObjectiveIds.length >= OBJECTIVES.length,
    });

    if (analysis.kind === "not_configured") {
      return failure("La configuration serveur est incomplète.", 401);
    }
    if (analysis.kind === "rate_limited") {
      return failure("Le service d'analyse est temporairement saturé.", 429);
    }
    if (analysis.kind === "invalid_output" || analysis.kind === "upstream_error") {
      return failure("L'analyse n'a pas pu être produite.", 502);
    }

    // 5. Assemblage : la note globale est recalculée ici, jamais reprise du modèle.
    const extraLimitations: string[] = [];
    if (conversation.perception?.redacted) {
      extraLimitations.push(
        "Les descripteurs physiques et démographiques produits par Tavus ont été retirés avant analyse.",
      );
    }
    if (!conversation.perception) {
      extraLimitations.push("Aucune analyse de perception n'était disponible pour cet appel.");
    }

    const report = buildCoachReport({
      reportId: crypto.randomUUID(),
      conversationId,
      model: analysis.model,
      output: analysis.output,
      commercial,
      sessionDate: conversation.createdAt,
      durationSeconds: conversation.durationSeconds,
      difficulty,
      selectedObjectiveIds,
      selectedObjectiveLabels,
      transcriptAvailable: true,
      // Le dialogue est conservé pour que le commercial puisse relire son appel.
      transcript: conversation.transcript,
      perceptionAvailable: Boolean(conversation.perception),
      extraLimitations,
    });

    return NextResponse.json<CoachAnalysisResponse>({ status: "ready", report }, { status: 200 });
  } finally {
    inFlightAnalyses.delete(conversationId);
  }
}
