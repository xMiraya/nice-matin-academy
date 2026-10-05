import { NextResponse } from "next/server";
import { guard, isResponse, jsonError } from "@/src/server/api";
import { pgAccessStore } from "@/src/server/access/pg-store";
import { adminError } from "@/src/server/access/http";
import { cancelOverride } from "@/src/server/access/service";

/** Annule une dérogation (elle reste visible dans l'historique). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/access/overrides/[id]">) {
  const user = await guard("manager");
  if (isResponse(user)) return user;
  const { id } = await ctx.params;
  try {
    const done = await cancelOverride({ id: user.profile.id, role: user.role }, id, pgAccessStore);
    if (!done) return jsonError("Dérogation introuvable ou déjà annulée.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}
