import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { profile: user.profile, role: user.role, email: user.email } });
}
