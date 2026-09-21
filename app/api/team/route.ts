import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/src/server/db";
import { hashPassword } from "@/src/server/password";
import { rowToProfile } from "@/src/server/auth";
import type { UserRow } from "@/src/server/auth";
import { guard, isResponse, jsonError, readJson } from "@/src/server/api";

const COLUMNS = "id,email,role,first_name,last_name,job_title,team,level,photo";

/** Équipe commerciale (comptes actifs et désactivés), réservée au manager. */
export async function GET() {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  const db = await getDb();
  const { rows } = await db.query<UserRow & { active: boolean }>(
    `SELECT ${COLUMNS}, active FROM users WHERE role = 'commercial' ORDER BY first_name, last_name`,
  );
  return NextResponse.json({
    members: rows.map((row) => ({ profile: rowToProfile(row), email: row.email, active: row.active })),
  });
}

const CreateBody = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
  jobTitle: z.string().trim().max(80).default("Commercial terrain"),
  team: z.string().trim().max(80).default("Nice-Matin"),
  level: z.enum(["debutant", "intermediaire", "confirme"]).nullable().default(null),
});

/** Crée un compte commercial. */
export async function POST(request: Request) {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await readJson(request, 8_000));
  } catch {
    return jsonError("Informations invalides (mot de passe : 8 caractères minimum).", 400);
  }
  const db = await getDb();
  const id = `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  try {
    await db.query(
      `INSERT INTO users (id,email,password_hash,role,first_name,last_name,job_title,team,level)
       VALUES ($1,$2,$3,'commercial',$4,$5,$6,$7,$8)`,
      [
        id,
        body.email.toLowerCase(),
        await hashPassword(body.password),
        body.firstName,
        body.lastName,
        body.jobTitle,
        body.team,
        body.level,
      ],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return jsonError("Un compte existe déjà avec cette adresse.", 409);
    }
    throw error;
  }
  return NextResponse.json({ id });
}
