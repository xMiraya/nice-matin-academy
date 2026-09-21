import { NextResponse } from "next/server";
import { getDb } from "@/src/server/db";
import { guard, isResponse } from "@/src/server/api";

/** Commercial : ses comptes rendus. Manager : ceux de toute l'équipe. */
export async function GET() {
  const user = await guard();
  if (isResponse(user)) return user;
  const db = await getDb();
  const { rows } =
    user.role === "manager"
      ? await db.query<{ data: unknown }>("SELECT data FROM reports ORDER BY generated_at DESC")
      : await db.query<{ data: unknown }>(
          "SELECT data FROM reports WHERE user_id = $1 ORDER BY generated_at DESC",
          [user.profile.id],
        );
  return NextResponse.json({ reports: rows.map((row) => row.data) });
}
