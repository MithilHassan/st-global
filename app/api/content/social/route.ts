import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/content";

// Public and unauthenticated on purpose — this is the same data already
// visible in the site's header, not sensitive. Nav.tsx is used from a
// client-rendered page (the booking wizard) as well as server-rendered
// ones, so it fetches this itself rather than relying on props from
// every page that renders it.
export const dynamic = "force-dynamic";

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json({ social: content.social });
}
