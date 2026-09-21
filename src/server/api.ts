import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/server/auth";
import type { AuthUser, Role } from "@/src/server/auth";

export const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/** Garde d'API : renvoie l'utilisateur, ou la réponse d'erreur à retourner telle quelle. */
export async function guard(role?: Role): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Authentification requise.", 401);
  if (role && user.role !== role) return jsonError("Accès refusé.", 403);
  return user;
}

export const isResponse = (value: AuthUser | NextResponse): value is NextResponse =>
  value instanceof NextResponse;

export async function readJson(request: Request, maxBytes = 2_000_000): Promise<unknown> {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error("too-large");
  return JSON.parse(raw);
}

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
