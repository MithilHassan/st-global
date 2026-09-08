import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  verifyLogin,
  createSessionToken,
  isAdminAuthConfigured,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin login isn't configured yet. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in your server environment.",
      },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const identity = await verifyLogin(email, password);
  if (!identity) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  cookies().set(ADMIN_COOKIE_NAME, createSessionToken(identity), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
