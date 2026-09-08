import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  getSessionIdentity,
  isSuperAdmin,
  listAdminUsers,
  createAdminUser,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isSuperAdmin(identity)) {
    return NextResponse.json({ error: "Only super admins can manage admin accounts." }, { status: 403 });
  }
  const admins = await listAdminUsers();
  return NextResponse.json({ admins });
}

export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isSuperAdmin(identity)) {
    return NextResponse.json({ error: "Only super admins can manage admin accounts." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const grantSuperAdmin = body?.isSuperAdmin === true;

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That doesn't look like a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const admin = await createAdminUser(name, email, password, grantSuperAdmin);
    return NextResponse.json({ admin });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create admin." },
      { status: 500 }
    );
  }
}
