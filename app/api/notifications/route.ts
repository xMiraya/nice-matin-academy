import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/src/server/db";
import { guard, isResponse, jsonError, readJson } from "@/src/server/api";

interface NotificationRow {
  id: string;
  kind: string;
  recipientId: string;
  authorName: string;
  title: string;
  message: string;
  href: string;
  createdAt: Date;
  read: boolean;
}

export async function GET() {
  const user = await guard();
  if (isResponse(user)) return user;
  const db = await getDb();
  const { rows } = await db.query<NotificationRow>(
    `SELECT id, kind, recipient_id AS "recipientId", author_name AS "authorName", title, message, href,
            created_at AS "createdAt", read
       FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [user.profile.id],
  );
  return NextResponse.json({
    notifications: rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString() })),
  });
}

const Body = z.union([z.object({ id: z.string().min(1) }), z.object({ all: z.literal(true) })]);

/** Marque une notification (ou toutes celles de l'utilisateur) comme lue. */
export async function PATCH(request: Request) {
  const user = await guard();
  if (isResponse(user)) return user;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(request, 2_000));
  } catch {
    return jsonError("Requête invalide.", 400);
  }
  const db = await getDb();
  if ("all" in body) {
    await db.query("UPDATE notifications SET read = TRUE WHERE recipient_id = $1", [user.profile.id]);
  } else {
    await db.query("UPDATE notifications SET read = TRUE WHERE id = $1 AND recipient_id = $2", [
      body.id,
      user.profile.id,
    ]);
  }
  return NextResponse.json({ ok: true });
}
