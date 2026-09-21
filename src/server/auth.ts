import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ExperienceLevel, UserProfile } from "@/src/types";
import { getDb } from "@/src/server/db";

export const SESSION_COOKIE = "nm_session";
const SESSION_DAYS = 30;

export type Role = "commercial" | "manager";

export interface AuthUser {
  profile: UserProfile;
  role: Role;
  email: string;
}

export interface UserRow {
  id: string;
  email: string;
  role: Role;
  first_name: string;
  last_name: string;
  job_title: string;
  team: string;
  level: string | null;
  photo: string | null;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function rowToProfile(row: UserRow): UserProfile {
  const initials = `${row.first_name[0] ?? ""}${row.last_name[0] ?? ""}`.toUpperCase();
  return {
    id: row.id,
    slug: slugify(`${row.first_name}-${row.last_name}`),
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.job_title,
    team: row.team,
    level: (row.level as ExperienceLevel | null) ?? undefined,
    initials,
    photo: row.photo ?? undefined,
  };
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const db = await getDb();
  await db.query("DELETE FROM sessions WHERE expires_at < now()");
  await db.query("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)", [
    hashToken(token),
    userId,
    expires,
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  }
  jar.delete(SESSION_COOKIE);
}

/** Utilisateur de la requête courante, ou `null` s'il n'est pas connecté. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const { rows } = await db.query<UserRow>(
    `SELECT u.id,u.email,u.role,u.first_name,u.last_name,u.job_title,u.team,u.level,u.photo
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`,
    [hashToken(token)],
  );
  const row = rows[0];
  return row ? { profile: rowToProfile(row), role: row.role, email: row.email } : null;
}

/** Pour les pages : redirige vers la connexion, ou vers l'espace de l'autre rôle. */
export async function requireRole(role: Role): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (user.role !== role) redirect(user.role === "manager" ? "/manager" : "/commercial");
  return user;
}

export function homeFor(role: Role): string {
  return role === "manager" ? "/manager" : "/commercial";
}
