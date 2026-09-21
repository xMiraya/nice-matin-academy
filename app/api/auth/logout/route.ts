import { NextResponse } from "next/server";
import { destroySession } from "@/src/server/auth";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
