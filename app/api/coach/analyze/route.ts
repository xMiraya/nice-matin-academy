import { NextResponse } from "next/server";
import { z } from "zod";
import type { CoachAnalysisResponse, CoachApiError, CoachPendingResponse, CoachReport } from "@/src/types/coach";
import { getTavusConversation, isValidConversationId } from "@/src/lib/tavus/get-conversation";
import { OBJECTIVES } from "@/src/data/competencies";
import { getDb } from "@/src/server/db";
import { getCurrentUser } from "@/src/server/auth";
import { logIntegration, safeErrorFields } from "@/src/server/log";
import {
  HISTORY_FETCH_LIMIT,
  buildHistorySummaries,
  type PreviousReportSummary,
} from "@/src/lib/coach/history";
import { isConversationOwner } from "@/src/server/access/conversations";
import {
  analyzeConversation,
  buildCoachReport,
  buildNonEvaluableReport,
} from "@/src/lib/coach/analyze-conversation";
import { evaluateTranscriptEligibility } from "@/src/lib/coach/evaluability";

/**
 * POST /api/coach/analyze — déclenche l'analyse d'une simulation par le Coach IA.
 *
 * Réservée aux commerciaux connectés : l'identité du commercial vient de la
 * session (jamais du corps de la requête) et le compte rendu est enregistré en
 * base avant d'être renvoyé. Une conversation déjà analysée renvoie son compte
 * rendu existant, sans nouvel appel au Coach.
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
  if (status >= 500 || status === 401 || status === 402 || status === 429) {
    logIntegration({ step: "coach.analyze", event: error, httpStatus: status, code: code ?? null });
  }
  return NextResponse.json<CoachApiError>(code ? { error, code } : { error }, { status });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return failure("Authentification requise.", 401);
  if (user.role !== "commercial") return failure("Réservé aux commerciaux.", 403);
  const commercial = {
    id: user.profile.id,
    name: `${user.profile.firstName} ${user.profile.lastName}`,
  };

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

  const { conversationId, difficulty, selectedObjectiveIds, selectedObjectiveLabels } =
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

  // Une conversation ne peut être analysée que par le commercial qui l'a lancée.
  if (!(await isConversationOwner(user.profile.id, conversationId))) {
    return failure("Conversation introuvable.", 404);
  }

  const db = await getDb();
  const existing = await db.query<{ user_id: string; data: CoachReport }>(
    "SELECT user_id, data FROM reports WHERE conversation_id = $1",
    [conversationId],
  );
  if (existing.rows[0]) {
    if (existing.rows[0].user_id !== user.profile.id) return failure("Conversation introuvable.", 404);
    return NextResponse.json<CoachAnalysisResponse>(
      { status: "ready", report: existing.rows[0].data },
      { status: 200 },
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

    if (!conversation.transcriptReady) {
      return pending(
        "waiting_for_transcript",
        "Le transcript est en cours de préparation par Tavus.",
      );
    }

    // 3 bis. Évaluabilité : décidée ici, par le serveur, sur le transcript nettoyé.
    // Une simulation sans matière à évaluer (ex. aucune parole du commercial) est
    // enregistrée pour traçabilité, sans appel OpenAI et sans note.
    const eligibility = evaluateTranscriptEligibility(conversation.transcript);
    if (!eligibility.evaluable) {
      const technical = buildNonEvaluableReport({
        reportId: crypto.randomUUID(),
        conversationId,
        reason: eligibility.reason,
        commercial,
        sessionDate: conversation.createdAt,
        durationSeconds: conversation.durationSeconds,
        difficulty,
        selectedObjectiveIds,
        selectedObjectiveLabels,
        transcript: conversation.transcript,
        perceptionAvailable: Boolean(conversation.perception),
      });
      await db.query(
        `INSERT INTO reports (report_id,user_id,conversation_id,generated_at,data)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (conversation_id) DO NOTHING`,
        [technical.reportId, user.profile.id, conversationId, technical.generatedAt, JSON.stringify(technical)],
      );
      logIntegration({
        step: "coach.analyze",
        event: "simulation non évaluable, aucun appel OpenAI",
        code: eligibility.reason,
        userId: user.profile.id,
        conversationId,
      });
      return NextResponse.json<CoachAnalysisResponse>({ status: "ready", report: technical }, { status: 200 });
    }

    // 4. Mémoire pédagogique : résumé compact des rapports précédents, sans transcript.
    // Jamais bloquant : en cas de lecture impossible, le Coach analyse sans historique.
    let history: PreviousReportSummary[] = [];
    try {
      const previous = await db.query<{ data: unknown }>(
        `SELECT data FROM reports
         WHERE user_id = $1 AND conversation_id <> $2
         ORDER BY generated_at DESC LIMIT ${HISTORY_FETCH_LIMIT}`,
        [user.profile.id, conversationId],
      );
      history = buildHistorySummaries(previous.rows.map((row) => row.data));
    } catch (error) {
      logIntegration({ step: "coach.history", event: "historique illisible", ...safeErrorFields(error) });
    }

    // 5. Appel du Coach sur des données déjà filtrées.
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
      history,
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

    // 6. Assemblage : la note globale est recalculée ici, jamais reprise du modèle.
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
      historyCount: history.length,
    });

    await db.query(
      `INSERT INTO reports (report_id,user_id,conversation_id,generated_at,data)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (conversation_id) DO NOTHING`,
      [report.reportId, user.profile.id, conversationId, report.generatedAt, JSON.stringify(report)],
    );

    return NextResponse.json<CoachAnalysisResponse>({ status: "ready", report }, { status: 200 });
  } finally {
    inFlightAnalyses.delete(conversationId);
  }
}
