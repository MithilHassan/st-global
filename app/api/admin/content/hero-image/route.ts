import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import { getSiteContent, setSiteContentBlock } from "@/lib/content";
import { uploadHeroImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }

  try {
    const imageUrl = await uploadHeroImage(file);
    const content = await getSiteContent();
    await setSiteContentBlock("hero", { ...content.hero, imageUrl });
    revalidatePath("/");
    const updated = await getSiteContent();
    return NextResponse.json({ content: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload image." },
      { status: 500 }
    );
  }
}

/** Reverts the hero back to the default illustration. */
export async function DELETE() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const content = await getSiteContent();
    await setSiteContentBlock("hero", { ...content.hero, imageUrl: null });
    revalidatePath("/");
    const updated = await getSiteContent();
    return NextResponse.json({ content: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove image." },
      { status: 500 }
    );
  }
}
