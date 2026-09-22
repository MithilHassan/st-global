import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, getSessionIdentity, isSuperAdmin } from "@/lib/adminAuth";
import { getSiteContent, setSiteContentBlock } from "@/lib/content";
import { uploadGalleryImage, deleteGalleryImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isSuperAdmin(identity)) {
    return NextResponse.json({ error: "Only super admins can manage site content." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }

  try {
    const { url, path } = await uploadGalleryImage(file);
    const content = await getSiteContent();
    await setSiteContentBlock("gallery", {
      ...content.gallery,
      images: [...content.gallery.images, { url, path, caption: "" }],
    });
    revalidatePath("/gallery");
    const updated = await getSiteContent();
    return NextResponse.json({ content: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload image." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isSuperAdmin(identity)) {
    return NextResponse.json({ error: "Only super admins can manage site content." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : "";
  if (!path) {
    return NextResponse.json({ error: "No image specified." }, { status: 400 });
  }

  try {
    const content = await getSiteContent();
    await deleteGalleryImage(path);
    await setSiteContentBlock("gallery", {
      ...content.gallery,
      images: content.gallery.images.filter((img) => img.path !== path),
    });
    revalidatePath("/gallery");
    const updated = await getSiteContent();
    return NextResponse.json({ content: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove image." },
      { status: 500 }
    );
  }
}
