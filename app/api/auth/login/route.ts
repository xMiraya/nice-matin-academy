import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/src/server/db";
import { verifyPassword } from "@/src/server/password";
import { createSession, homeFor } from "@/src/server/auth";
import type { Role } from "@/src/server/auth";
import { jsonError, readJson } from "@/src/server/api";

const Body = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200) });

/** Limitation simple des tentatives : 8 échecs par adresse et par quart d'heure. */
const failures = new Map<string, { count: number; until: number }>();

export async function POST(request: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(request, 4_000));
  } catch {
    return jsonError("Adresse ou mot de passe invalide.", 400);
  }
  const email = body.email.trim().toLowerCase();

  const state = failures.get(email);
  if (state && state.until > Date.now() && state.count >= 8) {
    return jsonError("Trop de tentatives. Réessayez dans quelques minutes.", 429);
  }

  const db = await getDb();
  const { rows } = await db.query<{ id: string; password_hash: string; role: Role }>(
    "SELECT id,password_hash,role FROM users WHERE email = $1 AND active",
    [email],
  );
  const user = rows[0];
  const ok = user ? await verifyPassword(body.password, user.password_hash) : false;
  if (!user || !ok) {
    const count = state && state.until > Date.now() ? state.count + 1 : 1;
    failures.set(email, { count, until: Date.now() + 15 * 60_000 });
    return jsonError("Adresse ou mot de passe incorrect.", 401);
  }

  failures.delete(email);
  await createSession(user.id);
  return NextResponse.json({ redirect: homeFor(user.role) });
}
