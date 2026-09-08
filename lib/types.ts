export type ShipmentMode = "air" | "ocean";

export type BookingStatus =
  | "booking_received"
  | "cargo_received"
  | "customs_clearance"
  | "in_transit"
  | "arrived"
  | "delivered";

export const STATUS_STAGES: { key: BookingStatus; label: string }[] = [
  { key: "booking_received", label: "Booking received" },
  { key: "cargo_received", label: "Cargo received at warehouse" },
  { key: "customs_clearance", label: "Customs clearance" },
  { key: "in_transit", label: "In transit" },
  { key: "arrived", label: "Arrived at destination" },
  { key: "delivered", label: "Delivered" },
];

export function stageIndex(status: string): number {
  const i = STATUS_STAGES.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

export function stageLabel(status: string): string {
  return STATUS_STAGES.find((s) => s.key === status)?.label ?? status;
}

export interface BookingEvent {
  status: string;
  note: string | null;
  occurred_at: string;
}

export interface TrackedShipment {
  tracking_number: string;
  mode: ShipmentMode;
  service_type: string | null;
  origin: string;
  destination: string;
  status: BookingStatus;
  pickup_date: string | null;
  created_at: string;
  events: BookingEvent[];
}

export interface InvoiceLineItem {
  description: string;
  unit: number;
  unitPrice: number;
}

export interface ChallanItem {
  description: string;
  qty: string;
  weight: string;
  remark: string;
}

export interface Invoice {
  id: string;
  booking_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  bill_to: string | null;
  shipper: string | null;
  consignee: string | null;
  pol: string | null;
  pod: string | null;
  rep: string | null;
  terms: string | null;
  exch_rate: number | null;
  truck_callan_no: string | null;
  hbl_no: string | null;
  pkgs: number | null;
  etd: string | null;
  eta: string | null;
  weight: number | null;
  line_items: InvoiceLineItem[];
  paid: number;
  in_words: string | null;
  company_phone: string | null;
  company_email: string | null;
  challan_no: string | null;
  challan_date: string | null;
  challan_name: string | null;
  challan_address: string | null;
  challan_contact: string | null;
  challan_items: ChallanItem[];
  created_at: string;
  updated_at: string;
}

export function blankLineItem(): InvoiceLineItem {
  return { description: "", unit: 1, unitPrice: 0 };
}

export function blankChallanItem(): ChallanItem {
  return { description: "", qty: "", weight: "", remark: "" };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return "Negative " + numberToWords(-n);
  let str = "";
  if (Math.floor(n / 1_000_000) > 0) {
    str += numberToWords(Math.floor(n / 1_000_000)) + " Million ";
    n %= 1_000_000;
  }
  if (Math.floor(n / 1000) > 0) {
    str += numberToWords(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (Math.floor(n / 100) > 0) {
    str += ONES[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) str += ONES[n];
    else {
      str += TENS[Math.floor(n / 10)];
      if (n % 10) str += " " + ONES[n % 10];
    }
  }
  return str.trim();
}

export function numberToWordsUSD(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  const dollars = Math.floor(safeAmount);
  const cents = Math.round((safeAmount - dollars) * 100);
  let result = numberToWords(dollars) + " Dollar" + (dollars !== 1 ? "s" : "");
  if (cents > 0) result += " and " + numberToWords(cents) + " Cent" + (cents !== 1 ? "s" : "");
  return result + " Only";
}
