import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  getSessionIdentity,
  isSuperAdmin,
  deleteAdminUser,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isSuperAdmin(identity)) {
    return NextResponse.json({ error: "Only super admins can manage admin accounts." }, { status: 403 });
  }

  try {
    await deleteAdminUser(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete admin." },
      { status: 500 }
    );
  }
}
