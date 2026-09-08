import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { STATUS_STAGES, stageLabel } from "@/lib/types";
import { sendBookingStatusUpdateEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const VALID_STATUSES = STATUS_STAGES.map((s) => s.key);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status = body?.status;
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;
  // Defaults to true — staff can uncheck "Notify customer by email" in the
  // admin UI for internal-only notes.
  const notify = body?.notify !== false;

  if (typeof status !== "string" || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: updated, error: updateError } = await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select("tracking_number, origin, destination, shipper_name, shipper_email")
      .single();
    if (updateError) throw updateError;

    const { error: eventError } = await supabase
      .from("booking_events")
      .insert({ booking_id: params.id, status, note });
    if (eventError) throw eventError;

    let emailSent = false;
    if (notify && updated?.shipper_email) {
      try {
        await sendBookingStatusUpdateEmail({
          trackingNumber: updated.tracking_number,
          fullName: updated.shipper_name,
          email: updated.shipper_email,
          origin: updated.origin,
          destination: updated.destination,
          statusLabel: stageLabel(status),
          note,
        });
        emailSent = true;
      } catch (emailErr) {
        // Never let an email hiccup block a status update that already
        // saved successfully — just log it server-side.
        console.error("Status update email failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true, emailSent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update status." },
      { status: 500 }
    );
  }
}
