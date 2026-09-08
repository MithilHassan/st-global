import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface BookingEditBody {
  service_type?: string;
  goods_type?: string;
  origin?: string;
  destination?: string;
  weight_kg?: number | string;
  packages?: number | string;
  dimensions?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  shipper_name?: string;
  shipper_company?: string | null;
  shipper_email?: string;
  shipper_phone?: string;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

/**
 * Edits a booking's own details (route, weight, contact info, etc.) — as
 * opposed to the status route, which only ever changes `status` and logs a
 * booking_events entry. This never touches status or history.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as BookingEditBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let update: Record<string, unknown>;
  try {
    const serviceType = requireString(body.service_type, "Service");
    const goodsType = requireString(body.goods_type, "Type of goods");
    const origin = requireString(body.origin, "Origin");
    const destination = requireString(body.destination, "Destination");
    const shipperName = requireString(body.shipper_name, "Shipper name");
    const shipperEmail = requireString(body.shipper_email, "Email address");
    const shipperPhone = requireString(body.shipper_phone, "Phone number");

    const weightKg = Number(body.weight_kg);
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      throw new Error("Enter a gross weight greater than zero.");
    }
    const packages = Number(body.packages);
    if (!Number.isFinite(packages) || packages < 1) {
      throw new Error("Enter at least one package.");
    }

    // Mode (air/ocean) is derived from the service text, same rule the
    // booking wizard uses at creation time, so editing the service keeps
    // the air/ocean badge consistent.
    const mode = /ocean/i.test(serviceType) ? "ocean" : "air";

    update = {
      service_type: serviceType,
      goods_type: goodsType,
      origin,
      destination,
      weight_kg: weightKg,
      packages,
      dimensions: body.dimensions?.trim() || null,
      shipping_address: body.shipping_address?.trim() || null,
      notes: body.notes?.trim() || null,
      shipper_name: shipperName,
      shipper_company: body.shipper_company?.trim() || null,
      shipper_email: shipperEmail,
      shipper_phone: shipperPhone,
      mode,
      updated_at: new Date().toISOString(),
    };
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid booking details." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .update(update)
      .eq("id", params.id)
      .select("*, booking_events(*)")
      .single();
    if (error) throw error;

    return NextResponse.json({ booking: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update booking." },
      { status: 500 }
    );
  }
}

/**
 * Deletes a booking outright. booking_events cascade-delete with it (see
 * schema). Any linked invoice is kept but its booking_id is set to null
 * rather than being deleted too — an invoice already sent to a customer
 * shouldn't vanish just because the booking record was cleaned up.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("bookings").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete booking." },
      { status: 500 }
    );
  }
}
