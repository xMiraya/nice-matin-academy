import { NextResponse } from "next/server";
import { guard, isResponse, jsonError } from "@/src/server/api";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { SIMULATION_IDS, getAccessStatus } from "@/src/server/access/service";

/** État de déverrouillage d'une simulation pour l'utilisateur connecté. */
export async function GET(_request: Request, ctx: RouteContext<"/api/simulations/[id]/access">) {
  const user = await guard();
  if (isResponse(user)) return user;
  const { id } = await ctx.params;
  if (!(SIMULATION_IDS as readonly string[]).includes(id)) return jsonError("Simulation inconnue.", 404);
  const status = await getAccessStatus(user.profile.id, id, pgAccessStore);
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}
