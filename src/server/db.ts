import "server-only";
import { Pool } from "pg";
import { hashPassword } from "@/src/server/password";

/**
 * Accès PostgreSQL du serveur.
 *
 * La base est fournie par la plateforme d'hébergement via `DB_URL` (ou
 * `DATABASE_URL`). Le schéma est créé au premier accès, de façon idempotente :
 * un déploiement sur une base vide fonctionne sans étape manuelle.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('commercial','manager')),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  job_title     TEXT NOT NULL DEFAULT '',
  team          TEXT NOT NULL DEFAULT 'Nice-Matin',
  level         TEXT,
  photo         TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  report_id       TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL UNIQUE,
  generated_at    TIMESTAMPTZ NOT NULL,
  data            JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS reports_user_idx ON reports (user_id, generated_at DESC);
CREATE TABLE IF NOT EXISTS report_comments (
  id          TEXT PRIMARY KEY,
  report_id   TEXT NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comments_report_idx ON report_comments (report_id, created_at);
CREATE TABLE IF NOT EXISTS notifications (
  id           TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL,
  author_name  TEXT NOT NULL,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  href         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  read         BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_id, created_at DESC);
CREATE TABLE IF NOT EXISTS content_overrides (
  key        TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  target_id  TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('draft','published')),
  patch      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS qcm_progress (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

interface Globals {
  __nmPool?: Pool;
  __nmReady?: Promise<void>;
}
const g = globalThis as Globals;

function connectionString(): string {
  const url = process.env.DB_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DB_URL est absent : aucune base de données n'est rattachée au site.");
  return url;
}

function makePool(): Pool {
  g.__nmPool ??= new Pool({ connectionString: connectionString(), max: 8 });
  return g.__nmPool;
}

/** Comptes créés à la première initialisation (mots de passe via l'environnement). */
async function seedUsers(pool: Pool): Promise<void> {
  const { rows } = await pool.query<{ count: string }>("SELECT count(*)::text AS count FROM users");
  if (rows[0]?.count !== "0") return;

  const seeds = [
    {
      id: "u-virginie-ballote",
      email: process.env.SEED_MANAGER_EMAIL ?? "virginie.ballote@gmail.com",
      password: process.env.SEED_MANAGER_PASSWORD,
      role: "manager",
      first: "Virginie",
      last: "Ballote",
      title: "Responsable commercial",
      team: "Nice-Matin",
      level: null,
      photo: null,
    },
    {
      id: "u-alexandre-jego",
      email: process.env.SEED_COMMERCIAL_EMAIL ?? "alexandre.jego@nicematin.local",
      password: process.env.SEED_COMMERCIAL_PASSWORD,
      role: "commercial",
      first: "Alexandre",
      last: "Jégo",
      title: "Commercial terrain",
      team: "Équipe Nice",
      level: "intermediaire",
      photo: "/images/equipe/alexandre-jego.jpg",
    },
  ] as const;

  for (const seed of seeds) {
    if (!seed.password) continue; // pas de mot de passe fourni : pas de compte.
    await pool.query(
      `INSERT INTO users (id,email,password_hash,role,first_name,last_name,job_title,team,level,photo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
      [
        seed.id,
        seed.email.toLowerCase(),
        await hashPassword(seed.password),
        seed.role,
        seed.first,
        seed.last,
        seed.title,
        seed.team,
        seed.level,
        seed.photo,
      ],
    );
  }
}

async function init(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    // Verrou : deux instances qui démarrent ensemble ne créent pas le schéma en double.
    await client.query("SELECT pg_advisory_lock(727101)");
    await client.query(SCHEMA);
    await seedUsers(pool);
    await client.query("SELECT pg_advisory_unlock(727101)");
  } finally {
    client.release();
  }
}

/** Pool prêt à l'emploi : schéma garanti. */
export async function getDb(): Promise<Pool> {
  const pool = makePool();
  g.__nmReady ??= init(pool).catch((error) => {
    g.__nmReady = undefined;
    throw error;
  });
  await g.__nmReady;
  return pool;
}
