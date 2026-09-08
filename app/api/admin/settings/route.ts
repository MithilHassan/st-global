import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, getSessionIdentity, hasCustomPassword, isSuperAdmin } from "@/lib/adminAuth";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const identity = getSessionIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const notificationOverride = await getSetting("admin_notification_email");
  const adminNotificationEmail =
    notificationOverride === null
      ? process.env.ADMIN_NOTIFICATION_EMAIL || null
      : notificationOverride || null;
  const notificationSource =
    notificationOverride === null
      ? process.env.ADMIN_NOTIFICATION_EMAIL
        ? "env"
        : "unset"
      : notificationOverride
      ? "custom"
      : "disabled";

  return NextResponse.json({
    identity,
    canManageAdmins: isSuperAdmin(identity),
    passwordIsCustom: await hasCustomPassword(),
    smtp: {
      configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
      host: process.env.SMTP_HOST || null,
      port: process.env.SMTP_PORT || null,
      user: process.env.SMTP_USER || null,
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || null,
    },
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    adminNotificationEmail,
    notificationSource,
  });
}
