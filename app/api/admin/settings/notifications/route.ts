import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import { setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const raw = body?.adminNotificationEmail;

  let valueToStore: string | null;
  if (raw === null) {
    // Explicit null = "reset to the ADMIN_NOTIFICATION_EMAIL env default".
    valueToStore = null;
  } else {
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    if (trimmed && !EMAIL_RE.test(trimmed)) {
      return NextResponse.json({ error: "That doesn't look like a valid email address." }, { status: 400 });
    }
    // "" = explicitly disable bcc, even if the env var is still set.
    valueToStore = trimmed;
  }

  try {
    await setSetting("admin_notification_email", valueToStore);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save setting." },
      { status: 500 }
    );
  }
}
