import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "invoice_number",
  "invoice_date",
  "bill_to",
  "shipper",
  "consignee",
  "pol",
  "pod",
  "rep",
  "terms",
  "exch_rate",
  "truck_callan_no",
  "hbl_no",
  "pkgs",
  "etd",
  "eta",
  "weight",
  "volume",
  "currency",
  "balance_type",
  "line_items",
  "paid",
  "in_words",
  "company_phone",
  "company_email",
  "challan_no",
  "challan_date",
  "challan_name",
  "challan_address",
  "challan_contact",
  "challan_items",
] as const;

// Invoice fields that are really just a copy of a booking field (set at
// "Generate invoice" time). Editing them here is meant to correct/update
// the shipment's real details, so they get written back to the booking
// too — otherwise the invoice and the booking silently disagree forever.
// `bill_to` is deliberately excluded: it's a free-form multi-line blob
// (name/company/email/phone combined), not safely reversible into the
// booking's separate fields.
const BOOKING_FIELD_MAP: Record<string, string> = {
  shipper: "shipper_name",
  pol: "origin",
  pod: "destination",
  pkgs: "packages",
  weight: "weight_kg",
  consignee: "consignee_name",
  terms: "incoterm",
};

// bookings.shipper_name / origin / destination are NOT NULL — never let a
// blanked-out invoice field wipe them out on the booking.
const REQUIRED_BOOKING_FIELDS = new Set(["shipper_name", "origin", "destination"]);

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, bookings(tracking_number, origin, destination)")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ invoice: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load invoice." },
      { status: 500 }
    );
  }
}

/** Saves all edits made in the invoice editor. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("invoices")
      .update(update)
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    // Push the overlapping fields back onto the linked booking, if any.
    let bookingSynced = false;
    if (data.booking_id) {
      const bookingUpdate: Record<string, unknown> = {};
      for (const [invoiceField, bookingField] of Object.entries(BOOKING_FIELD_MAP)) {
        if (!(invoiceField in body)) continue;
        const value = body[invoiceField];
        if (
          REQUIRED_BOOKING_FIELDS.has(bookingField) &&
          (typeof value !== "string" || !value.trim())
        ) {
          continue;
        }
        bookingUpdate[bookingField] = value;
      }

      if (Object.keys(bookingUpdate).length > 0) {
        bookingUpdate.updated_at = new Date().toISOString();
        const { error: bookingError } = await supabase
          .from("bookings")
          .update(bookingUpdate)
          .eq("id", data.booking_id);
        if (bookingError) {
          // The invoice itself already saved fine — don't fail the whole
          // request over the booking sync, just report it back.
          console.error("Failed to sync booking from invoice edit:", bookingError);
        } else {
          bookingSynced = true;
        }
      }
    }

    return NextResponse.json({ invoice: data, bookingSynced });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save invoice." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("invoices").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete invoice." },
      { status: 500 }
    );
  }
}
