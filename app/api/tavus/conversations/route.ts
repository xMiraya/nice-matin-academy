import { NextResponse } from "next/server";
import type {
  TavusApiErrorResponse,
  TavusConversationApiResponse,
  TavusConversationClientResponse,
  TavusConversationRequestBody,
  TavusErrorCode,
} from "@/src/types/tavus";

/**
 * POST /api/tavus/conversations — crée la visioconférence avec Julie.
 *
 * TODO sécurité : ajouter authentification, autorisation, limitation de débit et
 * stockage interne avant production.
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
].join(" ");

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

export async function POST() {
  const apiKey = process.env.TAVUS_API_KEY;
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
    conversation_name: `Nice-Matin Academy — Simulation Julie — ${new Date().toISOString()}`,
    custom_greeting: "Bonjour… Oui, je vous écoute ?",
    conversational_context: CONVERSATIONAL_CONTEXT,
    policy: "eu",
    require_auth: false,
    max_participants: 2,
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

  // Seuls ces trois champs quittent le serveur.
  const clientResponse: TavusConversationClientResponse = {
    conversation_id: payload.conversation_id,
    conversation_url: payload.conversation_url,
    status: payload.status,
  };

  return NextResponse.json(clientResponse, { status: 201 });
}
