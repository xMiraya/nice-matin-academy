import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/server/auth";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { recordConversation } from "@/src/server/access/conversations";
import {
  JULIE_SIMULATION_ID,
  checkSimulationEligibility,
  recordDenied,
  recordFirstAccess,
} from "@/src/server/access/service";
import type { SessionDifficulty } from "@/src/types";
import type {
  TavusApiErrorResponse,
  TavusConversationApiResponse,
  TavusConversationClientResponse,
  TavusConversationProperties,
  TavusConversationRequestBody,
  TavusErrorCode,
} from "@/src/types/tavus";

/**
 * POST /api/tavus/conversations — crée la visioconférence avec Julie.
 *
 * Réservée aux commerciaux connectés ET éligibles : le déverrouillage
 * pédagogique est vérifié ici, en base, avant tout appel à Tavus.
 *
 * `TAVUS_API_KEY`, `TAVUS_FACE_ID` et `TAVUS_PAL_ID` sont lus depuis
 * l'environnement serveur. Ils ne sont jamais renvoyés au navigateur, jamais
 * journalisés, et n'existent sous aucun préfixe `NEXT_PUBLIC_`.
 */

const TAVUS_CONVERSATIONS_URL = "https://tavusapi.com/v2/conversations";
const TAVUS_TIMEOUT_MS = 20_000;

/** Cadre de jeu transmis à Julie. Aucune donnée personnelle réelle. */
const CONVERSATIONAL_CONTEXT = [
  "Contexte de la simulation : vous êtes Julie Dupont, cliente potentielle de Nice-Matin.",
  "Votre interlocuteur est un commercial de Nice-Matin en formation.",
  "Il vous contacte pour vous présenter une offre d'abonnement au journal.",
  "Réagissez comme une vraie cliente : posez des questions sur le contenu, le prix et la durée d'engagement.",
  "Restez naturelle et exigeante, sans hostilité gratuite.",
  "Si le ton devient irrespectueux ou la démarche incohérente, vous pouvez mettre fin à l'échange poliment.",
  // Doublon assumé avec `properties.language` : la consigne côté prompt évite
  // les bascules d'une phrase à l'autre que le seul réglage moteur laisse passer.
  "La langue obligatoire de cette conversation est le français. Julie comprend et répond exclusivement en français naturel pendant toute la simulation.",
].join(" ");

/**
 * Consigne de jeu propre à chaque niveau de difficulté choisi dans l'écran de
 * préparation. Sans cela, les trois niveaux produisaient exactement la même
 * Julie.
 */
const DIFFICULTY_CONTEXT: Record<SessionDifficulty, string> = {
  facile: [
    "Niveau de la simulation : facile.",
    "Vous êtes disponible, curieuse et plutôt bien disposée.",
    "Vous posez peu d'objections et vous laissez le commercial dérouler sa présentation.",
    "Vous acceptez de poursuivre l'échange même si l'introduction est maladroite.",
  ].join(" "),
  intermediaire: [
    "Niveau de la simulation : intermédiaire.",
    "Vous êtes intéressée mais pressée : vous rappelez que vous avez peu de temps.",
    "Vous comparez avec la concurrence et demandez ce que Nice-Matin apporte de plus.",
    "Vous soulevez une ou deux objections concrètes, notamment sur le prix et l'engagement.",
  ].join(" "),
  difficile: [
    "Niveau de la simulation : difficile.",
    "Vous êtes méfiante, en particulier sur le prix et la durée d'engagement.",
    "Vous relancez sur les points restés flous et vous ne vous contentez pas d'une réponse vague.",
    "Si le ton devient pressant, insistant ou irrespectueux, vous mettez fin à l'échange poliment mais fermement.",
  ].join(" "),
};

const DIFFICULTIES = Object.keys(DIFFICULTY_CONTEXT) as SessionDifficulty[];

/** Lit le niveau demandé par le client ; retombe sur « intermédiaire ». */
async function readDifficulty(request: Request): Promise<SessionDifficulty> {
  try {
    const body: unknown = await request.json();
    const raw =
      body && typeof body === "object" ? (body as { difficulty?: unknown }).difficulty : undefined;
    return DIFFICULTIES.find((value) => value === raw) ?? "intermediaire";
  } catch {
    return "intermediaire";
  }
}

/**
 * Garde-fous de facturation. Tavus clôt la conversation lui-même : aucun
 * polling ni fonction serveur longue n'est nécessaire côté Nice-Matin Academy.
 */
const CONVERSATION_PROPERTIES: TavusConversationProperties = {
  language: "french",
  max_call_duration: 900,
  participant_left_timeout: 60,
  participant_absent_timeout: 120,
};

/** Messages affichés à l'utilisateur, associés à chaque code applicatif. */
const ERROR_MESSAGES: Record<TavusErrorCode, string> = {
  TAVUS_CREDITS_EXHAUSTED:
    "Les crédits conversationnels Tavus sont épuisés. Rechargez le compte Tavus avant de lancer une nouvelle simulation.",
  TAVUS_UNAUTHORIZED:
    "L'accès au service Tavus a été refusé. Vérifiez la configuration du compte Tavus.",
  TAVUS_CONFIGURATION_ERROR:
    "La configuration Tavus est incomplète côté serveur. Contactez l'administrateur de la plateforme.",
  TAVUS_CONVERSATION_CREATION_FAILED:
    "La simulation n'a pas pu être créée. Réessayez dans un instant.",
};

/** Statut HTTP renvoyé pour chaque code applicatif. */
const ERROR_STATUS: Record<TavusErrorCode, number> = {
  TAVUS_CREDITS_EXHAUSTED: 402,
  TAVUS_UNAUTHORIZED: 502,
  TAVUS_CONFIGURATION_ERROR: 500,
  TAVUS_CONVERSATION_CREATION_FAILED: 502,
};

function failure(code: TavusErrorCode): NextResponse<TavusApiErrorResponse> {
  return NextResponse.json<TavusApiErrorResponse>(
    { error: ERROR_MESSAGES[code], code },
    { status: ERROR_STATUS[code] },
  );
}

/**
 * Traduit une réponse Tavus en échec en code applicatif.
 * Le corps de la réponse est lu uniquement pour cette classification : il
 * n'est ni renvoyé au client, ni journalisé.
 */
async function classifyTavusFailure(response: Response): Promise<TavusErrorCode> {
  if (response.status === 402) return "TAVUS_CREDITS_EXHAUSTED";
  if (response.status === 401 || response.status === 403) return "TAVUS_UNAUTHORIZED";

  const body = await response.text().catch(() => "");
  if (body.toLowerCase().includes("out of conversational credits")) {
    return "TAVUS_CREDITS_EXHAUSTED";
  }

  return "TAVUS_CONVERSATION_CREATION_FAILED";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }

  // Garde pédagogique, relue en base : aucun score n'est reçu du navigateur.
  // Les managers (qui testent la plateforme) ne sont pas soumis aux prérequis.
  if (user.role === "commercial") {
    let eligibility;
    try {
      eligibility = await checkSimulationEligibility(
        user.profile.id,
        JULIE_SIMULATION_ID,
        pgAccessStore,
      );
    } catch {
      // En cas de doute, on refuse : jamais d'appel payant sans vérification.
      return NextResponse.json<TavusApiErrorResponse>(
        { error: "Le déverrouillage n'a pas pu être vérifié. Réessayez dans un instant." },
        { status: 503 },
      );
    }
    if (!eligibility.eligible) {
      await recordDenied(user.profile.id, JULIE_SIMULATION_ID, eligibility, pgAccessStore).catch(
        () => undefined,
      );
      return NextResponse.json(
        {
          eligible: false,
          requiredScore: eligibility.requiredScore,
          message: eligibility.message,
          requirements: eligibility.requirements,
        },
        { status: 403 },
      );
    }
  }

  const difficulty = await readDifficulty(request);
  const apiKey = process.env.TAVUS_API_KEY?.trim();
  const faceId = process.env.TAVUS_FACE_ID;
  const palId = process.env.TAVUS_PAL_ID;

  // Aucune précision sur la variable manquante : la configuration serveur ne
  // doit pas être déductible depuis le navigateur.
  if (!apiKey || !faceId || !palId) {
    return failure("TAVUS_CONFIGURATION_ERROR");
  }

  const requestBody: TavusConversationRequestBody = {
    face_id: faceId,
    pal_id: palId,
    conversation_name: `Nice-Matin Academy — Simulation Julie (${difficulty}) — ${new Date().toISOString()}`,
    custom_greeting: "Bonjour… Oui, je vous écoute ?",
    conversational_context: `${CONVERSATIONAL_CONTEXT} ${DIFFICULTY_CONTEXT[difficulty]}`,
    policy: "eu",
    require_auth: false,
    max_participants: 2,
    properties: CONVERSATION_PROPERTIES,
  };

  let tavusResponse: Response;
  try {
    tavusResponse = await fetch(TAVUS_CONVERSATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(TAVUS_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    return failure("TAVUS_CONVERSATION_CREATION_FAILED");
  }

  if (!tavusResponse.ok) {
    return failure(await classifyTavusFailure(tavusResponse));
  }

  let payload: TavusConversationApiResponse;
  try {
    payload = (await tavusResponse.json()) as TavusConversationApiResponse;
  } catch {
    return failure("TAVUS_CONVERSATION_CREATION_FAILED");
  }

  if (!payload.conversation_id || !payload.conversation_url) {
    return failure("TAVUS_CONVERSATION_CREATION_FAILED");
  }

  // Premier accès et rattachement de la conversation : seulement après le succès Tavus.
  if (user.role === "commercial") {
    await recordConversation(user.profile.id, JULIE_SIMULATION_ID, payload.conversation_id).catch(
      () => undefined,
    );
    await recordFirstAccess(user.profile.id, JULIE_SIMULATION_ID, pgAccessStore).catch(() => undefined);
  }

  // Seuls ces trois champs quittent le serveur.
  const clientResponse: TavusConversationClientResponse = {
    conversation_id: payload.conversation_id,
    conversation_url: payload.conversation_url,
    status: payload.status,
  };

  return NextResponse.json(clientResponse, { status: 201 });
}
