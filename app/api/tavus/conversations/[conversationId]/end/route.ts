import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/server/auth";
import { logIntegration, safeErrorFields } from "@/src/server/log";
import { isConversationOwner } from "@/src/server/access/conversations";
import type { TavusApiErrorResponse } from "@/src/types/tavus";

/**
 * Termine une conversation Tavus. La clé Tavus reste côté serveur ; le
 * navigateur ne fournit que l'identifiant de conversation, déjà public dans
 * l'URL de l'appel.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/tavus/conversations/[conversationId]/end">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }
  const { conversationId } = await ctx.params;
  if (user.role === "commercial" && !(await isConversationOwner(user.profile.id, conversationId))) {
    return NextResponse.json<TavusApiErrorResponse>({ error: "Accès refusé." }, { status: 403 });
  }

  if (!conversationId) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "Identifiant de conversation manquant." },
      { status: 400 },
    );
  }

  const apiKey = process.env.TAVUS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "La configuration Tavus est incomplète côté serveur." },
      { status: 500 },
    );
  }

  let tavusResponse: Response;
  try {
    tavusResponse = await fetch(
      `https://tavusapi.com/v2/conversations/${encodeURIComponent(conversationId)}/end`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      },
    );
  } catch (error) {
    logIntegration({ step: "tavus.end", event: "requête non aboutie", ...safeErrorFields(error), conversationId, userId: user.profile.id });
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "Impossible de joindre le service Tavus pour clore l'appel." },
      { status: 502 },
    );
  }

  logIntegration({
    step: "tavus.end",
    event: tavusResponse.ok ? "conversation close" : "refus Tavus",
    httpStatus: tavusResponse.status,
    conversationId,
    userId: user.profile.id,
  });
  if (!tavusResponse.ok) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "La clôture de la conversation Tavus a échoué." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ended: true }, { status: 200 });
}
