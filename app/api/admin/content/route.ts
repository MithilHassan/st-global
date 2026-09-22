import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, getSessionIdentity, isSuperAdmin } from "@/lib/adminAuth";
import { getSiteContent, setSiteContentBlock, type SiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

const VALID_KEYS = ["hero", "stats", "offices", "profile", "contacts", "footer", "social", "gallery"] as const;

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isSuperAdmin(identity)) {
    return NextResponse.json({ error: "Only super admins can manage site content." }, { status: 403 });
  }
  const content = await getSiteContent();
  return NextResponse.json({ content });
}

export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isSuperAdmin(identity)) {
    return NextResponse.json({ error: "Only super admins can manage site content." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const key = body?.key;
  const value = body?.value;

  if (!VALID_KEYS.includes(key)) {
    return NextResponse.json({ error: "Unknown content block." }, { status: 400 });
  }
  if (value === undefined || value === null || typeof value !== "object") {
    return NextResponse.json({ error: "Invalid content." }, { status: 400 });
  }

  try {
    await setSiteContentBlock(key as keyof SiteContent, value);
    // The homepage (and gallery page, if that's what changed) are
    // statically generated for speed — this makes the edit show up
    // immediately instead of waiting for the next deploy.
    revalidatePath("/");
    revalidatePath("/gallery");
    const content = await getSiteContent();
    return NextResponse.json({ content });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save content." },
      { status: 500 }
    );
  }
}
