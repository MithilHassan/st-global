import "server-only";
import { getSupabaseAdminClient } from "./supabaseAdmin";

export interface HeroContent {
  headline1: string;
  headline2: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  /** Public URL of an uploaded photo, or null to keep the default
   * illustration (components/PortSkylineArt.tsx). Set via the Content
   * page's image uploader — see lib/storage.ts. */
  imageUrl: string | null;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface OfficeItem {
  name: string;
  lines: string[];
  phone: string;
  email: string;
}

export interface OfficesContent {
  heading: string;
  offices: OfficeItem[];
}

export interface ProfileRow {
  label: string;
  value: string;
  badge: string | null;
}

export interface ProfileContent {
  heading: string;
  intro: string;
  rows: ProfileRow[];
}

export interface ContactItem {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface ContactsContent {
  heading: string;
  contacts: ContactItem[];
}

export interface FooterContent {
  heading: string;
  body: string;
  address: string;
  email: string;
  phone: string;
  copyrightLine: string;
}

export interface SocialLinks {
  twitter: string;
  instagram: string;
  linkedin: string;
  facebook: string;
}

export interface GalleryImage {
  url: string;
  /** Storage path, needed to delete the file later — not shown publicly. */
  path: string;
  caption: string;
}

export interface GalleryContent {
  heading: string;
  intro: string;
  images: GalleryImage[];
}

export interface SiteContent {
  hero: HeroContent;
  stats: StatItem[];
  offices: OfficesContent;
  profile: ProfileContent;
  contacts: ContactsContent;
  footer: FooterContent;
  social: SocialLinks;
  gallery: GalleryContent;
}

// Exactly what's hardcoded on the homepage today, so the site renders
// identically until someone actually edits something from /admin/content.
export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    headline1: "Global freight.",
    headline2: "Bangladesh expertise.",
    subheadline:
      "Reliable air, ocean and land freight solutions — connecting Bangladesh to the world.",
    ctaPrimary: "Book a shipment",
    ctaSecondary: "Track shipment",
    imageUrl: null,
  },
  stats: [
    { value: "11 / 12", label: "Air & ocean partners" },
    { value: "24 / 7", label: "CFS warehouse ops" },
    { value: "6", label: "Offices nationwide" },
    { value: "25", label: "Team members" },
  ],
  offices: {
    heading: "Six offices covering Dhaka's airport and Chittagong's port",
    offices: [
      {
        name: "Corporate Head Office",
        lines: ["KA-31, Joar Shahara, Baridhara", "Dhaka-1229, Bangladesh"],
        phone: "+880 1719-089697",
        email: "info@stbd.net",
      },
      {
        name: "Airport Office — Air Export",
        lines: ["Agent's Office Area, Cargo Village", "Shahjalal Int'l Airport, Kurmitola, Dhaka"],
        phone: "+880 1714-042541",
        email: "info@stbd.net",
      },
      {
        name: "Airport Office — Air Import",
        lines: ["Biman Import Building", "Shahjalal Int'l Airport, Kurmitola, Dhaka"],
        phone: "+880 1714-042541",
        email: "air-export@stbd.net",
      },
      {
        name: "Airfreight Warehouse",
        lines: ["House-20, Road 6, Jashimuddin Avenue", "Sector 01, Uttara, Dhaka-1229"],
        phone: "+880 1738-233790",
        email: "Contact: Mr. Anwar",
      },
      {
        name: "Chittagong City Office",
        lines: ["865 Abul Hossain Market", "Dhanialpara, D.T. Road, Chittagong"],
        phone: "+880 1714-042541",
        email: "cgp@stbd.net",
      },
      {
        name: "Seaport CFS Office 1 & 2",
        lines: ["C/O Esack Brothers Ind. Ltd, Halishahar", "C/O Shafi Motors Ltd, Foudarhat, Chittagong"],
        phone: "+880 1719-089697",
        email: "info@stbd.net",
      },
    ],
  },
  profile: {
    heading: "Registered, licensed and audit-ready",
    intro:
      "ST Global Forwarding is fully registered and licensed to deliver reliable, compliant and world-class forwarding services.",
    rows: [
      { label: "Registered name", value: "ST GLOBAL FORWARDING", badge: null },
      { label: "Company type", value: "Proprietorship company", badge: null },
      { label: "Customs license no.", value: "101-25-03-1215", badge: "Licensed" },
      { label: "Trade license no.", value: "TRAD/DNCC/040105/2024", badge: "Licensed" },
      { label: "VAT (BIN)", value: "006965811-0101", badge: "Licensed" },
      { label: "TIN", value: "776358981106", badge: "Licensed" },
      { label: "BAFFA membership no.", value: "1478", badge: "Member" },
      { label: "Total manpower", value: "25", badge: null },
      { label: "Key persons", value: "5", badge: null },
      { label: "Airport coverage", value: "Dhaka (Shahjalal International)", badge: null },
      { label: "Seaport coverage", value: "Chittagong, Mongla, Pangaon, Pairabandor, Dhaka ICD", badge: null },
      { label: "Port / CFS hours", value: "Open 24 hours, roster basis", badge: null },
    ],
  },
  contacts: {
    heading: "Talk to the desk that runs your shipment",
    contacts: [
      { name: "Tapos Kumar Saha", role: "Proprietor", phone: "+880 1719-089697", email: "tapos@stbd.net" },
      { name: "Shuvo Sarkar", role: "General Manager", phone: "+880 1719-089697", email: "shuvo@stbd.net" },
      { name: "Natasha Simsang", role: "Head of Operation — Air", phone: "+880 1531-825366", email: "natasha@stbd.net" },
      { name: "Lipi Saha", role: "Head of Operation — Sea", phone: "+880 1628-276393", email: "lipi@stbd.net" },
      { name: "Susmita Saha Biva", role: "Head of Air Freight", phone: "+880 1558-473375", email: "biva@stbd.net" },
    ],
  },
  footer: {
    heading: "Tell us the cargo, we'll route it.",
    body:
      "Reach the corporate head office in Baridhara, Dhaka for rates, space allocation and door-to-door quotations by air or sea.",
    address: "KA-31, Joar Shahara, Baridhara, Dhaka-1229, Bangladesh",
    email: "info@stbd.net",
    phone: "+880 1558-281854",
    copyrightLine: "Registered · BAFFA 1478 · TIN 776358981106",
  },
  // "#" (not blank) matches today's placeholder links, so nothing visibly
  // changes until an admin actually sets a real URL. A field left blank
  // once someone has edited this block hides that icon entirely — see
  // components/Nav.tsx.
  social: {
    twitter: "#",
    instagram: "#",
    linkedin: "#",
    facebook: "#",
  },
  gallery: {
    heading: "A look at our operations",
    intro:
      "Our warehouses, offices, and team at work across Dhaka and Chittagong.",
    images: [],
  },
};

/** Reads all content blocks, falling back to DEFAULT_CONTENT per-block
 * (and entirely, on any DB error — e.g. migration not run yet) so the
 * public site never breaks because of this table. */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from("site_content").select("key, value");
    if (error || !data) return DEFAULT_CONTENT;

    const merged: SiteContent = { ...DEFAULT_CONTENT };
    for (const row of data) {
      if (row.key in merged) {
        (merged as unknown as Record<string, unknown>)[row.key] = row.value;
      }
    }
    return merged;
  } catch {
    return DEFAULT_CONTENT;
  }
}

export async function setSiteContentBlock(
  key: keyof SiteContent,
  value: SiteContent[keyof SiteContent]
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}
