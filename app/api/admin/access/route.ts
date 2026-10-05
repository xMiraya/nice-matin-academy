import { NextResponse } from "next/server";
import { ASSESSMENTS } from "@/src/data/qcm/assessments";
import { COMPETENCIES } from "@/src/data/qcm/competencies";
import { getDb } from "@/src/server/db";
import { guard, isResponse, readJson } from "@/src/server/api";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { adminError } from "@/src/server/access/http";
import {
  JULIE_SIMULATION_ID,
  targetTitle,
  updateRequirements,
  updateThreshold,
} from "@/src/server/access/service";

/** Réglages, prérequis, dérogations et historique de l'accès à Julie (manager). */
export async function GET() {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  const db = await getDb();
  const [threshold, requirements] = await Promise.all([
    pgAccessStore.getThreshold(),
    pgAccessStore.getRequirements(JULIE_SIMULATION_ID),
  ]);
  const overrides = await db.query(
    `SELECT o.id, o.user_id AS "userId", u.first_name || ' ' || u.last_name AS "userName", o.reason,
            g.first_name || ' ' || g.last_name AS "grantedByName", o.granted_at AS "grantedAt",
            o.expires_at AS "expiresAt", o.revoked_at AS "revokedAt"
       FROM simulation_overrides o
       JOIN users u ON u.id = o.user_id JOIN users g ON g.id = o.granted_by
      WHERE o.simulation_id = $1 ORDER BY o.granted_at DESC LIMIT 100`,
    [JULIE_SIMULATION_ID],
  );
  const events = await db.query(
    `SELECT e.id, e.type, e.details, e.created_at AS "createdAt",
            u.first_name || ' ' || u.last_name AS "userName",
            a.first_name || ' ' || a.last_name AS "actorName"
       FROM access_events e
       LEFT JOIN users u ON u.id = e.user_id LEFT JOIN users a ON a.id = e.actor_id
      WHERE e.simulation_id = $1 ORDER BY e.created_at DESC LIMIT 100`,
    [JULIE_SIMULATION_ID],
  );
  return NextResponse.json({
    simulationId: JULIE_SIMULATION_ID,
    threshold,
    requirements,
    overrides: overrides.rows,
    events: events.rows,
    catalog: [
      ...ASSESSMENTS.map((a) => ({ kind: "ASSESSMENT", targetId: a.id, title: targetTitle("ASSESSMENT", a.id) })),
      ...COMPETENCIES.map((c) => ({ kind: "QUIZ", targetId: c.id, title: targetTitle("QUIZ", c.id) })),
    ],
  });
}

/** Modifie le seuil global (`{ threshold }`) ou la liste des prérequis (`{ requirements }`). */
export async function PUT(request: Request) {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  let body: { threshold?: unknown; requirements?: unknown };
  try {
    body = (await readJson(request, 50_000)) as typeof body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const actor = { id: user.profile.id, role: user.role };
  try {
    if (body.threshold !== undefined) await updateThreshold(actor, body.threshold, pgAccessStore);
    if (body.requirements !== undefined) {
      await updateRequirements(actor, JULIE_SIMULATION_ID, body.requirements, pgAccessStore);
    }
  } catch (error) {
    return adminError(error);
  }
  return NextResponse.json({ ok: true });
}
