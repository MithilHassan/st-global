import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface DimensionEntry {
  length?: string;
  width?: string;
  height?: string;
  quantity?: string;
  unit?: string;
}

interface BookingRequestBody {
  service?: string;
  goodsType?: string;
  commodityDeclaration?: string;
  origin?: string;
  destination?: string;
  grossWeight?: string;
  packages?: string;
  dimensions?: DimensionEntry[];
  volume?: string | null;
  etd?: string | null;
  eta?: string | null;
  manualTrackingNumber?: string | null;
  shipperName?: string;
  consigneeName?: string | null;
  billTo?: string;
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
    commodityDeclaration: string;
    origin: string;
    destination: string;
    grossWeight: number;
    packages: number;
    shipperName: string;
    billTo: string;
  };

  try {
    const service = requireString(body.service, "Service");
    const goodsType = requireString(body.goodsType, "Type of goods");
    const commodityDeclaration = requireString(body.commodityDeclaration, "Commodity declaration");
    const origin = requireString(body.origin, "Origin");
    const destination = requireString(body.destination, "Destination");
    const shipperName = requireString(body.shipperName, "Shipper name");
    const billTo = requireString(body.billTo, "Bill to");

    const grossWeight = Number(body.grossWeight);
    if (!Number.isFinite(grossWeight) || grossWeight <= 0) {
      throw new Error("Enter a gross weight greater than zero.");
    }
    const packages = Number(body.packages);
    if (!Number.isFinite(packages) || packages < 1) {
      throw new Error("Enter at least one package.");
    }

    fields = {
      service,
      goodsType,
      commodityDeclaration,
      origin,
      destination,
      grossWeight,
      packages,
      shipperName,
      billTo,
    };
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid booking details." },
      { status: 400 }
    );
  }

  const dimensionsList = Array.isArray(body.dimensions)
    ? body.dimensions
        .filter((d) => d && (d.length || d.width || d.height))
        .map((d) => ({
          length: d.length || "",
          width: d.width || "",
          height: d.height || "",
          quantity: d.quantity || "1",
          unit: d.unit || "cm",
        }))
    : [];

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("create_booking", {
      p_service: fields.service,
      p_goods_type: fields.goodsType,
      p_commodity_declaration: fields.commodityDeclaration,
      p_origin: fields.origin,
      p_destination: fields.destination,
      p_gross_weight_kg: fields.grossWeight,
      p_packages: fields.packages,
      p_dimensions_list: dimensionsList,
      p_volume: body.volume || null,
      p_manual_tracking_number: body.manualTrackingNumber || null,
      p_shipper_name: fields.shipperName,
      p_consignee_name: body.consigneeName || null,
      p_bill_to: fields.billTo,
      p_etd: body.etd || null,
      p_eta: body.eta || null,
    });

    if (error) throw error;
    const trackingNumber = data as string;

    // No email is collected on the booking form anymore, so there's
    // nothing to send a confirmation to — this simply becomes a no-op
    // rather than an error. Staff can still add an email to the booking
    // later (via the admin edit API) if a customer provides one by other
    // means, and status-update emails will start working from then on.
    return NextResponse.json({ trackingNumber, emailSent: false });
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
