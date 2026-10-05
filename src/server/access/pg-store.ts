import "server-only";
import { getDb } from "@/src/server/db";
import { DEFAULT_THRESHOLD, withTitles } from "@/src/server/access/service";
import type { AccessStore } from "@/src/server/access/service";
import type { AccessOverride } from "@/src/server/access/eligibility";
import type { QuestionPatchLike } from "@/src/lib/qcm/effective";

const THRESHOLD_KEY = "julie_unlock_threshold";
const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface OverrideRow {
  id: string;
  user_id: string;
  simulation_id: string;
  reason: string;
  granted_by: string;
  granted_at: Date;
  expires_at: Date | null;
  revoked_at: Date | null;
}

const toOverride = (row: OverrideRow): AccessOverride & { simulationId: string } => ({
  id: row.id,
  userId: row.user_id,
  simulationId: row.simulation_id,
  reason: row.reason,
  grantedBy: row.granted_by,
  grantedAt: new Date(row.granted_at).toISOString(),
  expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
  revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : null,
});

/** Implémentation PostgreSQL du magasin d'accès. */
export const pgAccessStore: AccessStore = {
  async getThreshold() {
    const db = await getDb();
    const { rows } = await db.query<{ value: unknown }>("SELECT value FROM app_settings WHERE key = $1", [
      THRESHOLD_KEY,
    ]);
    const value = Number(rows[0]?.value);
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : DEFAULT_THRESHOLD;
  },

  async setThreshold(value, actorId) {
    const db = await getDb();
    await db.query(
      `INSERT INTO app_settings (key,value,updated_by) VALUES ($1,$2::jsonb,$3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by`,
      [THRESHOLD_KEY, JSON.stringify(value), actorId],
    );
  },

  async getRequirements(simulationId) {
    const db = await getDb();
    const { rows } = await db.query<{
      id: string;
      kind: "QUIZ" | "ASSESSMENT";
      target_id: string;
      required_score: string | null;
      active: boolean;
    }>(
      "SELECT id,kind,target_id,required_score,active FROM simulation_requirements WHERE simulation_id = $1 ORDER BY kind, target_id",
      [simulationId],
    );
    return withTitles(
      rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        targetId: row.target_id,
        requiredScore: row.required_score === null ? null : Number(row.required_score),
        active: row.active,
      })),
    );
  },

  async replaceRequirements(simulationId, items) {
    const db = await getDb();
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM simulation_requirements WHERE simulation_id = $1", [simulationId]);
      for (const item of items) {
        await client.query(
          `INSERT INTO simulation_requirements (id,simulation_id,kind,target_id,required_score,active)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [newId("req"), simulationId, item.kind, item.targetId, item.requiredScore, item.active],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async getAttempts(userId) {
    const db = await getDb();
    const { rows } = await db.query<{ kind: "QUIZ" | "ASSESSMENT"; target_id: string; score: string }>(
      "SELECT kind,target_id,score FROM qcm_attempts WHERE user_id = $1",
      [userId],
    );
    return rows.map((row) => ({
      userId,
      kind: row.kind,
      targetId: row.target_id,
      score: Number(row.score),
    }));
  },

  async saveAttempt(attempt) {
    const db = await getDb();
    await db.query(
      `INSERT INTO qcm_attempts (id,user_id,kind,target_id,score,earned,max_points,duration_seconds,answers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        newId("att"),
        attempt.userId,
        attempt.kind,
        attempt.targetId,
        attempt.score,
        attempt.earned,
        attempt.max,
        attempt.durationSeconds,
        JSON.stringify(attempt.answers),
      ],
    );
  },

  async getOverrides(userId, simulationId) {
    const db = await getDb();
    const { rows } = await db.query<OverrideRow>(
      "SELECT * FROM simulation_overrides WHERE user_id = $1 AND simulation_id = $2",
      [userId, simulationId],
    );
    return rows.map(toOverride);
  },

  async createOverride(input) {
    const db = await getDb();
    const { rows } = await db.query<OverrideRow>(
      `INSERT INTO simulation_overrides (id,user_id,simulation_id,reason,granted_by,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [newId("ovr"), input.userId, input.simulationId, input.reason, input.grantedBy, input.expiresAt],
    );
    return toOverride(rows[0]);
  },

  async revokeOverride(id, actorId) {
    const db = await getDb();
    const { rows } = await db.query<OverrideRow>(
      `UPDATE simulation_overrides SET revoked_at = now(), revoked_by = $2
        WHERE id = $1 AND revoked_at IS NULL RETURNING *`,
      [id, actorId],
    );
    return rows[0] ? toOverride(rows[0]) : null;
  },

  async getPublishedQuestionPatches() {
    const db = await getDb();
    const { rows } = await db.query<{ target_id: string; patch: QuestionPatchLike }>(
      "SELECT target_id, patch FROM content_overrides WHERE kind = 'question' AND status = 'published'",
    );
    return new Map(rows.map((row) => [row.target_id, row.patch]));
  },

  async logEvent(event) {
    const db = await getDb();
    await db.query(
      `INSERT INTO access_events (id,user_id,actor_id,simulation_id,type,details) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        newId("evt"),
        event.userId,
        event.actorId ?? null,
        event.simulationId,
        event.type,
        JSON.stringify(event.details ?? {}),
      ],
    );
  },

  async logEventOnce(event) {
    const db = await getDb();
    const result = await db.query(
      `INSERT INTO access_events (id,user_id,actor_id,simulation_id,type,details) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING`,
      [
        newId("evt"),
        event.userId,
        event.actorId ?? null,
        event.simulationId,
        event.type,
        JSON.stringify(event.details ?? {}),
      ],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
