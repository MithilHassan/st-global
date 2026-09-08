import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendBookingConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

interface BookingRequestBody {
  service?: string;
  goodsType?: string;
  specialInstructions?: string | null;
  origin?: string;
  destination?: string;
  grossWeight?: string;
  packages?: string;
  dimensions?: string | null;
  shippingAddress?: string;
  fullName?: string;
  companyName?: string | null;
  email?: string;
  phone?: string;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as BookingRequestBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let fields: {
    service: string;
    goodsType: string;
    origin: string;
    destination: string;
    grossWeight: number;
    packages: number;
    shippingAddress: string;
    fullName: string;
    email: string;
    phone: string;
  };

  try {
    const service = requireString(body.service, "Service");
    const goodsType = requireString(body.goodsType, "Type of goods");
    const origin = requireString(body.origin, "Origin");
    const destination = requireString(body.destination, "Destination");
    const shippingAddress = requireString(body.shippingAddress, "Shipping address");
    const fullName = requireString(body.fullName, "Full name");
    const email = requireString(body.email, "Email address");
    const phone = requireString(body.phone, "Phone number");

    const grossWeight = Number(body.grossWeight);
    if (!Number.isFinite(grossWeight) || grossWeight <= 0) {
      throw new Error("Enter a gross weight greater than zero.");
    }
    const packages = Number(body.packages);
    if (!Number.isFinite(packages) || packages < 1) {
      throw new Error("Enter at least one package.");
    }

    fields = { service, goodsType, origin, destination, grossWeight, packages, shippingAddress, fullName, email, phone };
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid booking details." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("create_booking", {
      p_service: fields.service,
      p_goods_type: fields.goodsType,
      p_special_instructions: body.specialInstructions || null,
      p_origin: fields.origin,
      p_destination: fields.destination,
      p_gross_weight_kg: fields.grossWeight,
      p_packages: fields.packages,
      p_dimensions: body.dimensions || null,
      p_shipping_address: fields.shippingAddress,
      p_full_name: fields.fullName,
      p_company_name: body.companyName || null,
      p_email: fields.email,
      p_phone: fields.phone,
    });

    if (error) throw error;
    const trackingNumber = data as string;

    let emailSent = true;
    try {
      await sendBookingConfirmationEmail({
        trackingNumber,
        fullName: fields.fullName,
        email: fields.email,
        service: fields.service,
        goodsType: fields.goodsType,
        origin: fields.origin,
        destination: fields.destination,
        grossWeight: String(fields.grossWeight),
        packages: String(fields.packages),
        dimensions: body.dimensions || null,
        shippingAddress: fields.shippingAddress,
        specialInstructions: body.specialInstructions || null,
      });
    } catch (emailErr) {
      // Never let an email hiccup take down a successful booking — the
      // tracking number is already saved. Just log it server-side.
      emailSent = false;
      console.error("Booking confirmation email failed:", emailErr);
    }

    return NextResponse.json({ trackingNumber, emailSent });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Something went wrong submitting the booking. Please try again.",
      },
      { status: 500 }
    );
  }
}
