import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Lists all invoices (with their booking's tracking number/route) for the
 * dashboard overview and any future invoices index.
 */
export async function GET() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date, line_items, paid, booking_id, created_at, bookings(tracking_number, origin, destination)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ invoices: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load invoices." },
      { status: 500 }
    );
  }
}

/**
 * "Generate invoice" — called from a booking's detail panel.
 * If an invoice already exists for this booking, returns it unchanged so
 * the admin lands on their existing (possibly already-edited) invoice.
 * Otherwise creates a new one pre-filled from the booking's details.
 */
export async function POST(request: Request) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingId = typeof body?.booking_id === "string" ? body.booking_id : null;

  if (!bookingId) {
    return NextResponse.json({ error: "booking_id is required." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from("invoices")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json({ invoice: existing, created: false });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    if (bookingError) throw bookingError;

    const bill_to = booking.shipper_company
      ? `${booking.shipper_name}\n${booking.shipper_company}\n${booking.shipper_email}\n${booking.shipper_phone}`
      : `${booking.shipper_name}\n${booking.shipper_email}\n${booking.shipper_phone}`;

    const prefill = {
      booking_id: bookingId,
      invoice_date: new Date().toISOString().slice(0, 10),
      invoice_number: `INV-${booking.tracking_number}`,
      bill_to,
      shipper: booking.shipper_name,
      consignee: booking.consignee_name ?? booking.consignee_address ?? "",
      pol: booking.origin,
      pod: booking.destination,
      terms: booking.incoterm ?? "",
      hbl_no: booking.tracking_number,
      pkgs: booking.packages ? Number(booking.packages) : null,
      weight: booking.weight_kg ? Number(booking.weight_kg) : null,
      line_items: [
        {
          description:
            booking.cargo_description ??
            booking.goods_type ??
            booking.service_type ??
            "Freight forwarding services",
          unit: booking.packages ? Number(booking.packages) : 1,
          unitPrice: 0,
        },
      ],
      challan_no: booking.tracking_number, // = hbl_no
      challan_date: new Date().toISOString().slice(0, 10), // = invoice_date
      challan_name: booking.shipper_name, // = shipper
      challan_address: bill_to, // = bill_to — kept in sync with it afterward, see InvoiceEditor.tsx
      challan_contact: booking.shipper_phone,
      challan_items: [
        {
          description:
            booking.cargo_description ?? booking.goods_type ?? booking.service_type ?? "",
          qty: booking.packages ? String(booking.packages) : "",
          weight: booking.weight_kg ? `${booking.weight_kg} kg` : "",
          remark: "",
        },
      ],
    };

    const { data: created, error: insertError } = await supabase
      .from("invoices")
      .insert(prefill)
      .select()
      .single();
    if (insertError) throw insertError;

    return NextResponse.json({ invoice: created, created: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to open invoice." },
      { status: 500 }
    );
  }
}
