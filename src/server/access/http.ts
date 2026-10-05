import "server-only";
import { NextResponse } from "next/server";
import { ForbiddenError, ValidationError } from "@/src/server/access/service";

/** Traduit les erreurs métier de l'administration en réponses HTTP. */
export function adminError(error: unknown): NextResponse {
  if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
  if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
  throw error;
}
