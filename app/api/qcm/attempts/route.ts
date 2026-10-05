import { NextResponse } from "next/server";
import { guard, isResponse, jsonError, readJson } from "@/src/server/api";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { AttemptSchema, submitAttempt } from "@/src/server/access/service";

/**
 * Enregistre une tentative de QCM ou d'évaluation.
 * Le navigateur n'envoie que ses réponses : le score est recalculé ici.
 */
export async function POST(request: Request) {
  const user = await guard("commercial");
  if (isResponse(user)) return user;
  let body: ReturnType<typeof AttemptSchema.parse>;
  try {
    body = AttemptSchema.parse(await readJson(request, 200_000));
  } catch {
    return jsonError("Tentative invalide.", 400);
  }
  const result = await submitAttempt(user.profile.id, body, pgAccessStore);
  if (!result.ok) return jsonError(result.error, result.status);
  return NextResponse.json({ ok: true });
}
