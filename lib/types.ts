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
  volume: string | null;
  currency: string;
  line_items: InvoiceLineItem[];
  paid: number;
  balance_type: string;
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

export interface CurrencyInfo {
  code: string;
  symbol: string;
  majorUnit: string;
  minorUnit: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "AED", symbol: "AED", majorUnit: "Dirham", minorUnit: "Fils" },
  { code: "AFN", symbol: "Af", majorUnit: "Afghani", minorUnit: "Pul" },
  { code: "ALL", symbol: "L", majorUnit: "Lek", minorUnit: "Qindarkë" },
  { code: "AMD", symbol: "֏", majorUnit: "Dram", minorUnit: "Luma" },
  { code: "ANG", symbol: "ƒ", majorUnit: "Guilder", minorUnit: "Cent" },
  { code: "AOA", symbol: "Kz", majorUnit: "Kwanza", minorUnit: "Cêntimo" },
  { code: "ARS", symbol: "$", majorUnit: "Peso", minorUnit: "Centavo" },
  { code: "AUD", symbol: "A$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "AWG", symbol: "ƒ", majorUnit: "Florin", minorUnit: "Cent" },
  { code: "AZN", symbol: "₼", majorUnit: "Manat", minorUnit: "Qəpik" },
  { code: "BAM", symbol: "KM", majorUnit: "Convertible Mark", minorUnit: "Fening" },
  { code: "BBD", symbol: "Bds$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "BDT", symbol: "৳", majorUnit: "Taka", minorUnit: "Paisa" },
  { code: "BGN", symbol: "лв", majorUnit: "Lev", minorUnit: "Stotinka" },
  { code: "BHD", symbol: "BD", majorUnit: "Dinar", minorUnit: "Fils" },
  { code: "BIF", symbol: "FBu", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "BMD", symbol: "BD$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "BND", symbol: "B$", majorUnit: "Dollar", minorUnit: "Sen" },
  { code: "BOB", symbol: "Bs", majorUnit: "Boliviano", minorUnit: "Centavo" },
  { code: "BRL", symbol: "R$", majorUnit: "Real", minorUnit: "Centavo" },
  { code: "BSD", symbol: "B$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "BTN", symbol: "Nu.", majorUnit: "Ngultrum", minorUnit: "Chetrum" },
  { code: "BWP", symbol: "P", majorUnit: "Pula", minorUnit: "Thebe" },
  { code: "BYN", symbol: "Br", majorUnit: "Ruble", minorUnit: "Kapyeyka" },
  { code: "BZD", symbol: "BZ$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "CAD", symbol: "C$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "CDF", symbol: "FC", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "CHF", symbol: "CHF", majorUnit: "Franc", minorUnit: "Rappen" },
  { code: "CLP", symbol: "$", majorUnit: "Peso", minorUnit: "Centavo" },
  { code: "CNY", symbol: "¥", majorUnit: "Yuan", minorUnit: "Fen" },
  { code: "COP", symbol: "$", majorUnit: "Peso", minorUnit: "Centavo" },
  { code: "CRC", symbol: "₡", majorUnit: "Colón", minorUnit: "Céntimo" },
  { code: "CUP", symbol: "$", majorUnit: "Peso", minorUnit: "Centavo" },
  { code: "CVE", symbol: "$", majorUnit: "Escudo", minorUnit: "Centavo" },
  { code: "CZK", symbol: "Kč", majorUnit: "Koruna", minorUnit: "Haléř" },
  { code: "DJF", symbol: "Fdj", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "DKK", symbol: "kr", majorUnit: "Krone", minorUnit: "Øre" },
  { code: "DOP", symbol: "RD$", majorUnit: "Peso", minorUnit: "Centavo" },
  { code: "DZD", symbol: "DA", majorUnit: "Dinar", minorUnit: "Centime" },
  { code: "EGP", symbol: "E£", majorUnit: "Pound", minorUnit: "Piastre" },
  { code: "ERN", symbol: "Nfk", majorUnit: "Nakfa", minorUnit: "Cent" },
  { code: "ETB", symbol: "Br", majorUnit: "Birr", minorUnit: "Santim" },
  { code: "EUR", symbol: "€", majorUnit: "Euro", minorUnit: "Cent" },
  { code: "FJD", symbol: "FJ$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "FKP", symbol: "£", majorUnit: "Pound", minorUnit: "Penny" },
  { code: "GBP", symbol: "£", majorUnit: "Pound", minorUnit: "Pence" },
  { code: "GEL", symbol: "₾", majorUnit: "Lari", minorUnit: "Tetri" },
  { code: "GHS", symbol: "GH₵", majorUnit: "Cedi", minorUnit: "Pesewa" },
  { code: "GIP", symbol: "£", majorUnit: "Pound", minorUnit: "Penny" },
  { code: "GMD", symbol: "D", majorUnit: "Dalasi", minorUnit: "Butut" },
  { code: "GNF", symbol: "FG", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "GTQ", symbol: "Q", majorUnit: "Quetzal", minorUnit: "Centavo" },
  { code: "GYD", symbol: "G$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "HKD", symbol: "HK$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "HNL", symbol: "L", majorUnit: "Lempira", minorUnit: "Centavo" },
  { code: "HRK", symbol: "kn", majorUnit: "Kuna", minorUnit: "Lipa" },
  { code: "HTG", symbol: "G", majorUnit: "Gourde", minorUnit: "Centime" },
  { code: "HUF", symbol: "Ft", majorUnit: "Forint", minorUnit: "Fillér" },
  { code: "IDR", symbol: "Rp", majorUnit: "Rupiah", minorUnit: "Sen" },
  { code: "ILS", symbol: "₪", majorUnit: "Shekel", minorUnit: "Agora" },
  { code: "INR", symbol: "₹", majorUnit: "Rupee", minorUnit: "Paisa" },
  { code: "IQD", symbol: "ID", majorUnit: "Dinar", minorUnit: "Fils" },
  { code: "IRR", symbol: "﷼", majorUnit: "Rial", minorUnit: "Dinar" },
  { code: "ISK", symbol: "kr", majorUnit: "Króna", minorUnit: "Eyrir" },
  { code: "JMD", symbol: "J$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "JOD", symbol: "JD", majorUnit: "Dinar", minorUnit: "Fils" },
  { code: "JPY", symbol: "¥", majorUnit: "Yen", minorUnit: "Sen" },
  { code: "KES", symbol: "KSh", majorUnit: "Shilling", minorUnit: "Cent" },
  { code: "KGS", symbol: "с", majorUnit: "Som", minorUnit: "Tyiyn" },
  { code: "KHR", symbol: "៛", majorUnit: "Riel", minorUnit: "Sen" },
  { code: "KMF", symbol: "CF", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "KPW", symbol: "₩", majorUnit: "Won", minorUnit: "Chon" },
  { code: "KRW", symbol: "₩", majorUnit: "Won", minorUnit: "Jeon" },
  { code: "KWD", symbol: "KD", majorUnit: "Dinar", minorUnit: "Fils" },
  { code: "KYD", symbol: "CI$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "KZT", symbol: "₸", majorUnit: "Tenge", minorUnit: "Tiyn" },
  { code: "LAK", symbol: "₭", majorUnit: "Kip", minorUnit: "Att" },
  { code: "LBP", symbol: "L£", majorUnit: "Pound", minorUnit: "Piastre" },
  { code: "LKR", symbol: "Rs", majorUnit: "Rupee", minorUnit: "Cent" },
  { code: "LRD", symbol: "L$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "LSL", symbol: "L", majorUnit: "Loti", minorUnit: "Sente" },
  { code: "LYD", symbol: "LD", majorUnit: "Dinar", minorUnit: "Dirham" },
  { code: "MAD", symbol: "DH", majorUnit: "Dirham", minorUnit: "Centime" },
  { code: "MDL", symbol: "L", majorUnit: "Leu", minorUnit: "Ban" },
  { code: "MGA", symbol: "Ar", majorUnit: "Ariary", minorUnit: "Iraimbilanja" },
  { code: "MKD", symbol: "ден", majorUnit: "Denar", minorUnit: "Deni" },
  { code: "MMK", symbol: "K", majorUnit: "Kyat", minorUnit: "Pya" },
  { code: "MNT", symbol: "₮", majorUnit: "Tögrög", minorUnit: "Möngö" },
  { code: "MOP", symbol: "MOP$", majorUnit: "Pataca", minorUnit: "Avo" },
  { code: "MRU", symbol: "UM", majorUnit: "Ouguiya", minorUnit: "Khoums" },
  { code: "MUR", symbol: "₨", majorUnit: "Rupee", minorUnit: "Cent" },
  { code: "MVR", symbol: "Rf", majorUnit: "Rufiyaa", minorUnit: "Laari" },
  { code: "MWK", symbol: "MK", majorUnit: "Kwacha", minorUnit: "Tambala" },
  { code: "MXN", symbol: "$", majorUnit: "Peso", minorUnit: "Centavo" },
  { code: "MYR", symbol: "RM", majorUnit: "Ringgit", minorUnit: "Sen" },
  { code: "MZN", symbol: "MT", majorUnit: "Metical", minorUnit: "Centavo" },
  { code: "NAD", symbol: "N$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "NGN", symbol: "₦", majorUnit: "Naira", minorUnit: "Kobo" },
  { code: "NIO", symbol: "C$", majorUnit: "Córdoba", minorUnit: "Centavo" },
  { code: "NOK", symbol: "kr", majorUnit: "Krone", minorUnit: "Øre" },
  { code: "NPR", symbol: "₨", majorUnit: "Rupee", minorUnit: "Paisa" },
  { code: "NZD", symbol: "NZ$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "OMR", symbol: "RO", majorUnit: "Rial", minorUnit: "Baisa" },
  { code: "PAB", symbol: "B/.", majorUnit: "Balboa", minorUnit: "Centésimo" },
  { code: "PEN", symbol: "S/", majorUnit: "Sol", minorUnit: "Céntimo" },
  { code: "PGK", symbol: "K", majorUnit: "Kina", minorUnit: "Toea" },
  { code: "PHP", symbol: "₱", majorUnit: "Peso", minorUnit: "Centavo" },
  { code: "PKR", symbol: "₨", majorUnit: "Rupee", minorUnit: "Paisa" },
  { code: "PLN", symbol: "zł", majorUnit: "Złoty", minorUnit: "Grosz" },
  { code: "PYG", symbol: "₲", majorUnit: "Guaraní", minorUnit: "Céntimo" },
  { code: "QAR", symbol: "QR", majorUnit: "Riyal", minorUnit: "Dirham" },
  { code: "RON", symbol: "lei", majorUnit: "Leu", minorUnit: "Ban" },
  { code: "RSD", symbol: "дин", majorUnit: "Dinar", minorUnit: "Para" },
  { code: "RUB", symbol: "₽", majorUnit: "Ruble", minorUnit: "Kopeck" },
  { code: "RWF", symbol: "FRw", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "SAR", symbol: "SR", majorUnit: "Riyal", minorUnit: "Halala" },
  { code: "SBD", symbol: "SI$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "SCR", symbol: "SR", majorUnit: "Rupee", minorUnit: "Cent" },
  { code: "SDG", symbol: "SDG", majorUnit: "Pound", minorUnit: "Piastre" },
  { code: "SEK", symbol: "kr", majorUnit: "Krona", minorUnit: "Öre" },
  { code: "SGD", symbol: "S$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "SHP", symbol: "£", majorUnit: "Pound", minorUnit: "Penny" },
  { code: "SLE", symbol: "Le", majorUnit: "Leone", minorUnit: "Cent" },
  { code: "SOS", symbol: "Sh", majorUnit: "Shilling", minorUnit: "Cent" },
  { code: "SRD", symbol: "$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "SSP", symbol: "£", majorUnit: "Pound", minorUnit: "Piastre" },
  { code: "STN", symbol: "Db", majorUnit: "Dobra", minorUnit: "Cêntimo" },
  { code: "SYP", symbol: "£S", majorUnit: "Pound", minorUnit: "Piastre" },
  { code: "SZL", symbol: "L", majorUnit: "Lilangeni", minorUnit: "Cent" },
  { code: "THB", symbol: "฿", majorUnit: "Baht", minorUnit: "Satang" },
  { code: "TJS", symbol: "SM", majorUnit: "Somoni", minorUnit: "Diram" },
  { code: "TMT", symbol: "m", majorUnit: "Manat", minorUnit: "Tenge" },
  { code: "TND", symbol: "DT", majorUnit: "Dinar", minorUnit: "Millime" },
  { code: "TOP", symbol: "T$", majorUnit: "Paʻanga", minorUnit: "Seniti" },
  { code: "TRY", symbol: "₺", majorUnit: "Lira", minorUnit: "Kuruş" },
  { code: "TTD", symbol: "TT$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "TWD", symbol: "NT$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "TZS", symbol: "TSh", majorUnit: "Shilling", minorUnit: "Cent" },
  { code: "UAH", symbol: "₴", majorUnit: "Hryvnia", minorUnit: "Kopiyka" },
  { code: "UGX", symbol: "USh", majorUnit: "Shilling", minorUnit: "Cent" },
  { code: "USD", symbol: "$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "UYU", symbol: "$U", majorUnit: "Peso", minorUnit: "Centésimo" },
  { code: "UZS", symbol: "лв", majorUnit: "Som", minorUnit: "Tiyin" },
  { code: "VES", symbol: "Bs", majorUnit: "Bolívar", minorUnit: "Céntimo" },
  { code: "VND", symbol: "₫", majorUnit: "Dong", minorUnit: "Xu" },
  { code: "VUV", symbol: "VT", majorUnit: "Vatu", minorUnit: "Centime" },
  { code: "WST", symbol: "WS$", majorUnit: "Tala", minorUnit: "Sene" },
  { code: "XAF", symbol: "FCFA", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "XCD", symbol: "EC$", majorUnit: "Dollar", minorUnit: "Cent" },
  { code: "XOF", symbol: "CFA", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "XPF", symbol: "₣", majorUnit: "Franc", minorUnit: "Centime" },
  { code: "YER", symbol: "﷼", majorUnit: "Rial", minorUnit: "Fils" },
  { code: "ZAR", symbol: "R", majorUnit: "Rand", minorUnit: "Cent" },
  { code: "ZMW", symbol: "ZK", majorUnit: "Kwacha", minorUnit: "Ngwee" },
  { code: "ZWL", symbol: "Z$", majorUnit: "Dollar", minorUnit: "Cent" },
];

export function getCurrencyInfo(code: string | null | undefined): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
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

/** Generates "in words" text for any of the CURRENCIES above — e.g.
 * "Four Hundred Taka Only" for BDT, "Four Hundred Dollars Only" for USD. */
export function numberToWordsCurrency(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const safeAmount = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  const major = Math.floor(safeAmount);
  const minor = Math.round((safeAmount - major) * 100);
  let result = numberToWords(major) + " " + info.majorUnit + (major !== 1 ? "s" : "");
  if (minor > 0) result += " and " + numberToWords(minor) + " " + info.minorUnit + (minor !== 1 ? "s" : "");
  return result + " Only";
}

/** @deprecated use numberToWordsCurrency(amount, "USD") — kept so any
 * existing saved invoice data comparing against this exact wording still
 * matches. */
export function numberToWordsUSD(amount: number): string {
  return numberToWordsCurrency(amount, "USD");
}
