import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/src/server/db";
import { hashPassword } from "@/src/server/password";
import { guard, isResponse, jsonError, readJson } from "@/src/server/api";

const Body = z.object({
  active: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
  jobTitle: z.string().trim().max(80).optional(),
  team: z.string().trim().max(80).optional(),
  level: z.enum(["debutant", "intermediaire", "confirme"]).nullable().optional(),
});

/** Modifie un commercial : activation, mot de passe, poste, équipe, niveau. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/team/[id]">) {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  const { id } = await ctx.params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await readJson(request, 8_000));
  } catch {
    return jsonError("Modification invalide.", 400);
  }
  const db = await getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  const add = (column: string, value: unknown) => {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  };
  if (body.active !== undefined) add("active", body.active);
  if (body.password !== undefined) add("password_hash", await hashPassword(body.password));
  if (body.jobTitle !== undefined) add("job_title", body.jobTitle);
  if (body.team !== undefined) add("team", body.team);
  if (body.level !== undefined) add("level", body.level);
  if (sets.length === 0) return jsonError("Rien à modifier.", 400);

  values.push(id);
  const result = await db.query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length} AND role = 'commercial'`,
    values,
  );
  if (result.rowCount === 0) return jsonError("Commercial introuvable.", 404);
  if (body.active === false || body.password !== undefined) {
    await db.query("DELETE FROM sessions WHERE user_id = $1", [id]);
  }
  return NextResponse.json({ ok: true });
}
