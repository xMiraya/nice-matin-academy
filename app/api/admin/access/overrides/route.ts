import { NextResponse } from "next/server";
import { guard, isResponse, readJson } from "@/src/server/api";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { adminError } from "@/src/server/access/http";
import { JULIE_SIMULATION_ID, grantOverride } from "@/src/server/access/service";

/** Déverrouille exceptionnellement Julie pour un commercial (manager uniquement). */
export async function POST(request: Request) {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  let body: unknown;
  try {
    body = await readJson(request, 10_000);
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  try {
    const override = await grantOverride(
      { id: user.profile.id, role: user.role },
      JULIE_SIMULATION_ID,
      body,
      pgAccessStore,
    );
    return NextResponse.json({ override });
  } catch (error) {
    return adminError(error);
  }
}
