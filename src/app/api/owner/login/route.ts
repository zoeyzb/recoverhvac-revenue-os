import { NextResponse } from "next/server";
import { OWNER_COOKIE, ownerToken, validOwnerPassword } from "@/lib/owner-auth";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (!validOwnerPassword(String(password ?? ""))) {
    return NextResponse.json({ error: "Incorrect password or owner access is not configured." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_COOKIE, ownerToken(process.env.OWNER_DASHBOARD_PASSWORD!, process.env.OWNER_SESSION_SECRET!), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12,
  });
  return response;
}
