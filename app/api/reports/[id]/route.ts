import { NextResponse } from "next/server";
import { getDb } from "@/src/server/db";
import { guard, isResponse, jsonError } from "@/src/server/api";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/reports/[id]">) {
  const user = await guard();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;
  const db = await getDb();
  const result =
    user.role === "manager"
      ? await db.query("DELETE FROM reports WHERE report_id = $1", [id])
      : await db.query("DELETE FROM reports WHERE report_id = $1 AND user_id = $2", [
          id,
          user.profile.id,
        ]);
  if (result.rowCount === 0) return jsonError("Compte rendu introuvable.", 404);
  return NextResponse.json({ ok: true });
}
