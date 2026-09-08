import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  getSessionIdentity,
  checkMasterPassword,
  setAdminPassword,
  verifyAdminPasswordById,
  updateAdminPasswordById,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    if (identity.kind === "admin") {
      if (!(await verifyAdminPasswordById(identity.id, currentPassword))) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
      await updateAdminPasswordById(identity.id, newPassword);
    } else {
      if (!(await checkMasterPassword(currentPassword))) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
      await setAdminPassword(newPassword);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Failed to save new password: ${err.message}`
            : "Failed to save new password.",
      },
      { status: 500 }
    );
  }
}
