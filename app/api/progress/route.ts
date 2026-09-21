import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/src/server/db";
import { guard, isResponse, jsonError, readJson } from "@/src/server/api";

const EMPTY = { version: 1, trainings: [], results: [], openSessions: {} };

/** Progression QCM de l'utilisateur connecté (ou, pour un manager, d'un commercial). */
export async function GET(request: Request) {
  const user = await guard();
  if (isResponse(user)) return user;
  const target = new URL(request.url).searchParams.get("userId");
  const userId = target && user.role === "manager" ? target : user.profile.id;
  const db = await getDb();
  const { rows } = await db.query<{ data: unknown }>(
    "SELECT data FROM qcm_progress WHERE user_id = $1",
    [userId],
  );
  return NextResponse.json({ progress: rows[0]?.data ?? EMPTY });
}

const Body = z.object({
  version: z.literal(1),
  trainings: z.array(z.unknown()).max(5000),
  results: z.array(z.unknown()).max(5000),
  openSessions: z.record(z.string(), z.unknown()),
});

export async function PUT(request: Request) {
  const user = await guard();
  if (isResponse(user)) return user;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(request, 3_000_000));
  } catch {
    return jsonError("Progression invalide.", 400);
  }
  const db = await getDb();
  await db.query(
    `INSERT INTO qcm_progress (user_id,data) VALUES ($1,$2)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [user.profile.id, JSON.stringify(body)],
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await guard();
  if (isResponse(user)) return user;
  const db = await getDb();
  await db.query("DELETE FROM qcm_progress WHERE user_id = $1", [user.profile.id]);
  return NextResponse.json({ ok: true });
}
