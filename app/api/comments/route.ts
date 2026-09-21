import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/src/server/db";
import { guard, isResponse, jsonError, newId, readJson } from "@/src/server/api";

interface CommentRow {
  id: string;
  reportId: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: Date;
}

/** Commentaires visibles : ceux des comptes rendus accessibles à l'utilisateur. */
export async function GET() {
  const user = await guard();
  if (isResponse(user)) return user;
  const db = await getDb();
  const { rows } =
    user.role === "manager"
      ? await db.query<CommentRow>(
          `SELECT id, report_id AS "reportId", author_name AS "authorName", author_role AS "authorRole",
                  text, created_at AS "createdAt" FROM report_comments ORDER BY created_at`,
        )
      : await db.query<CommentRow>(
          `SELECT c.id, c.report_id AS "reportId", c.author_name AS "authorName", c.author_role AS "authorRole",
                  c.text, c.created_at AS "createdAt"
             FROM report_comments c JOIN reports r ON r.report_id = c.report_id
            WHERE r.user_id = $1 ORDER BY c.created_at`,
          [user.profile.id],
        );
  return NextResponse.json({
    comments: rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString() })),
  });
}

const Body = z.object({
  reportId: z.string().min(1).max(120),
  text: z.string().trim().min(1).max(4000),
});

/**
 * Ajoute un commentaire. Le manager qui commente notifie le commercial ; la
 * réponse du commercial notifie les managers.
 */
export async function POST(request: Request) {
  const user = await guard();
  if (isResponse(user)) return user;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(request, 20_000));
  } catch {
    return jsonError("Commentaire invalide.", 400);
  }

  const db = await getDb();
  const { rows } = await db.query<{ user_id: string }>(
    "SELECT user_id FROM reports WHERE report_id = $1",
    [body.reportId],
  );
  const report = rows[0];
  if (!report) return jsonError("Compte rendu introuvable.", 404);
  if (user.role === "commercial" && report.user_id !== user.profile.id) {
    return jsonError("Accès refusé.", 403);
  }

  const authorName = `${user.profile.firstName} ${user.profile.lastName}`;
  const id = newId("comment");
  const { rows: created } = await db.query<{ created_at: Date }>(
    `INSERT INTO report_comments (id,report_id,author_id,author_name,author_role,text)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING created_at`,
    [id, body.reportId, user.profile.id, authorName, user.role, body.text],
  );

  const preview = body.text.length > 140 ? `${body.text.slice(0, 137)}…` : body.text;
  const insertNotification = `INSERT INTO notifications (id,recipient_id,kind,author_name,title,message,href)
                              VALUES ($1,$2,'coach-comment',$3,$4,$5,$6)`;
  if (user.role === "manager") {
    await db.query(insertNotification, [
      newId("notif"),
      report.user_id,
      authorName,
      "Nouveau commentaire de votre manager",
      preview,
      `/commercial/simulations/${body.reportId}`,
    ]);
  } else {
    const { rows: managers } = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE role = 'manager' AND active",
    );
    for (const manager of managers) {
      await db.query(insertNotification, [
        newId("notif"),
        manager.id,
        authorName,
        `${authorName} a répondu à un compte rendu`,
        preview,
        `/manager/simulations/${body.reportId}`,
      ]);
    }
  }

  return NextResponse.json({
    comment: {
      id,
      reportId: body.reportId,
      authorName,
      authorRole: user.role,
      text: body.text,
      createdAt: new Date(created[0].created_at).toISOString(),
    },
  });
}
