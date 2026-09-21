import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/src/server/db";
import { guard, isResponse, jsonError, readJson } from "@/src/server/api";

interface OverrideRow {
  key: string;
  kind: string;
  targetId: string;
  status: string;
  patch: unknown;
  updatedAt: Date;
  updatedBy: string;
}

const SELECT = `SELECT key, kind, target_id AS "targetId", status, patch,
                       updated_at AS "updatedAt", updated_by AS "updatedBy" FROM content_overrides`;

/** Le commercial ne voit que le publié ; le manager voit aussi les brouillons. */
export async function GET() {
  const user = await guard();
  if (isResponse(user)) return user;
  const db = await getDb();
  const { rows } =
    user.role === "manager"
      ? await db.query<OverrideRow>(SELECT)
      : await db.query<OverrideRow>(`${SELECT} WHERE status = 'published'`);
  return NextResponse.json({
    overrides: rows.map((row) => ({ ...row, updatedAt: new Date(row.updatedAt).toISOString() })),
  });
}

const Body = z.object({
  kind: z.enum(["sheet", "question"]),
  targetId: z.string().min(1).max(120),
  status: z.enum(["draft", "published"]),
  patch: z.record(z.string(), z.unknown()),
});

/** Enregistre un brouillon ou publie (manager uniquement). */
export async function PUT(request: Request) {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(request, 200_000));
  } catch {
    return jsonError("Contenu invalide.", 400);
  }
  const db = await getDb();
  await db.query(
    `INSERT INTO content_overrides (key,kind,target_id,status,patch,updated_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (key) DO UPDATE SET status = EXCLUDED.status, patch = EXCLUDED.patch,
       updated_at = now(), updated_by = EXCLUDED.updated_by`,
    [
      `${body.kind}:${body.targetId}`,
      body.kind,
      body.targetId,
      body.status,
      JSON.stringify(body.patch),
      `${user.profile.firstName} ${user.profile.lastName}`,
    ],
  );
  return NextResponse.json({ ok: true });
}

/** Retour au contenu d'origine (supprime l'écart, brouillon compris). */
export async function DELETE(request: Request) {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const targetId = url.searchParams.get("targetId");
  if (!kind || !targetId) return jsonError("Paramètres manquants.", 400);
  const db = await getDb();
  await db.query("DELETE FROM content_overrides WHERE key = $1", [`${kind}:${targetId}`]);
  return NextResponse.json({ ok: true });
}
