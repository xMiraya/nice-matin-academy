import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/server/auth";
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
  if (!(await getCurrentUser())) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "Authentification requise." },
      { status: 401 },
    );
  }
  const { conversationId } = await ctx.params;

  if (!conversationId) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "Identifiant de conversation manquant." },
      { status: 400 },
    );
  }

  const apiKey = process.env.TAVUS_API_KEY;
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
  } catch {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "Impossible de joindre le service Tavus pour clore l'appel." },
      { status: 502 },
    );
  }

  if (!tavusResponse.ok) {
    return NextResponse.json<TavusApiErrorResponse>(
      { error: "La clôture de la conversation Tavus a échoué." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ended: true }, { status: 200 });
}
