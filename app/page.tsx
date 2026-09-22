import Image from "next/image";
import Nav from "@/components/Nav";
import SectionEyebrow from "@/components/SectionEyebrow";
import RouteManifest from "@/components/RouteManifest";
import PortSkylineArt from "@/components/PortSkylineArt";
import WorldMapPortArt from "@/components/WorldMapPortArt";
import {
  PackageIcon,
  SearchIcon,
  PlaneIcon,
  ShipIcon,
  TruckIcon,
  ShieldCheckIcon,
  GlobeIcon,
  BuildingIcon,
  UsersIcon,
  BriefcaseIcon,
  FileIcon,
  PercentIcon,
  IdCardIcon,
  AwardIcon,
  ClockIcon,
  UserIcon,
  HandshakeIcon,
} from "@/components/icons";
import { CORE_SERVICES } from "@/lib/site-data";
import { getSiteContent } from "@/lib/content";

const MANIFEST_LIST = [
  "Air freight (express & general)",
  "Ocean freight",
  "Handling of GOH containers",
  "Combined service of sea/air & air/sea",
  "NVOCC, break bulk, consolidation (air + sea)",
  "Handling containers at ICD",
  "AOG / time critical shipment",
  "Handling of pharma shipment",
  "Country wide domestic transportation",
  "Customs brokerage (air, sea & land)",
  "International express courier (import & export)",
  "Pick & pack operations",
  "Exhibition shipment",
  "DAP / DDP / door-to-door shipment",
  "Project & heavylift shipment",
  "Door to door import, any country of origin",
  "Door to door export, any destination",
  "DDP shipment without L/C or TT",
  "Door to door export cum import shipments",
  "Used goods export",
  "Packaging service (carton, palletise, crate)",
];

// Icons for the company-profile rows, matched to content.profile.rows by
// position — icons themselves aren't editable from the CMS.
const PROFILE_ICONS = [
  BuildingIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  FileIcon,
  PercentIcon,
  IdCardIcon,
  AwardIcon,
  UsersIcon,
  UserIcon,
  PlaneIcon,
  ShipIcon,
  ClockIcon,
];

const TRUST_BADGES = [
  { icon: ShieldCheckIcon, title: "Fully compliant", subtitle: "Government regulations" },
  { icon: AwardIcon, title: "Licensed & certified", subtitle: "Trusted & verified" },
  { icon: HandshakeIcon, title: "Trusted partner", subtitle: "Global standards" },
  { icon: GlobeIcon, title: "Global reach", subtitle: "Local expertise" },
];

const STAT_ICONS = [GlobeIcon, ShipIcon, BuildingIcon, UsersIcon];

const AIR_CARRIERS = ["EK", "QR", "SV", "EY", "TG", "TK", "CX", "SQ", "MH", "KU", "BA"];
const OCEAN_CARRIERS = ["ONE", "APL", "HPL", "CMA CGM", "MSC", "MAERSK", "HMM", "OOCL", "COSCO", "EMC", "ZIM", "YML"];

export default async function Home() {
  const content = await getSiteContent();
  return (
    <main id="top" className="bg-paper text-ink">
      <Nav />

      {/* HERO */}
      <section className="relative isolate min-h-[620px] overflow-hidden md:min-h-[680px]">
        <div className="absolute inset-0 h-full w-full">
          {content.hero.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL; avoids requiring a per-project next.config.js domain allowlist entry
            <img src={content.hero.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <PortSkylineArt className="h-full w-full" />
          )}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,30,51,0.97) 0%, rgba(11,30,51,0.88) 40%, rgba(11,30,51,0.55) 65%, rgba(11,30,51,0.25) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-28 pt-16 md:pb-32 md:pt-24">
          <h1 className="max-w-3xl font-display text-4xl font-bold uppercase leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl">
            {content.hero.headline1}
            <br />
            {content.hero.headline2}
          </h1>
          <div className="mt-5 h-1 w-16 bg-royalLight" />
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/80">
            {content.hero.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/booking"
              className="flex items-center gap-2 border border-royal bg-royal px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-white transition-colors hover:bg-royalLight hover:border-royalLight hover:text-ink"
            >
              <PackageIcon className="h-4 w-4" />
              {content.hero.ctaPrimary}
            </a>
            <a
              href="/tracking"
              className="flex items-center gap-2 border border-white/70 px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-white transition-colors hover:border-white hover:bg-white/10"
            >
              <SearchIcon className="h-4 w-4" />
              {content.hero.ctaSecondary}
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/20 pt-6 text-white/85">
            {[
              { icon: PlaneIcon, label: "Air Freight" },
              { icon: ShipIcon, label: "Ocean Freight" },
              { icon: TruckIcon, label: "Land Transport" },
              { icon: ShieldCheckIcon, label: "Customs Brokerage" },
            ].map((m, i) => (
              <div
                key={m.label}
                className={`flex items-center gap-2 text-[13px] font-medium ${i !== 0 ? "border-l border-white/25 pl-6" : ""}`}
              >
                <m.icon className="h-4 w-4 shrink-0" />
                {m.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS — overlapping the hero's bottom edge */}
      <div className="relative z-20 mx-auto -mt-14 max-w-6xl px-6 md:-mt-16">
        <div className="grid grid-cols-2 gap-6 border border-line bg-white px-8 py-8 shadow-xl shadow-ink/10 sm:grid-cols-4 md:gap-4">
          {content.stats.map((s, i) => {
            const Icon = STAT_ICONS[i] ?? GlobeIcon;
            return (
              <div key={s.label + i} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal/10 text-royal">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold text-ink md:text-2xl">{s.value}</p>
                  <p className="text-[11px] uppercase leading-snug tracking-wide text-ink/50">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-16 md:h-20" />

      {/* SERVICES */}
      <section id="services" className="border-b border-line py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow>Manifest — line items 01–06</SectionEyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            One forwarder, every mode of cargo movement
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {CORE_SERVICES.map((s) => (
              <div key={s.code} className="bg-paper p-7 transition-colors hover:bg-white">
                <span className="font-mono text-xs text-royal">{s.code}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.detail}</p>
              </div>
            ))}
          </div>

          <details className="mt-8 border border-line bg-white/50 open:bg-white">
            <summary className="cursor-pointer select-none px-6 py-4 font-mono text-[12px] uppercase tracking-wider text-ink/70">
              Full service manifest (21 line items)
            </summary>
            <ul className="grid gap-x-8 gap-y-3 border-t border-line px-6 py-6 font-body text-sm text-ink/75 sm:grid-cols-2">
              {MANIFEST_LIST.map((item, i) => (
                <li key={item} className="flex gap-3">
                  <span className="font-mono text-xs text-ink/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      {/* AIR / OCEAN FEATURE BLOCKS */}
      <section className="border-b border-line">
        <FeatureBlock
          eyebrow="Air freight"
          title="Top-ten agent standing with every major carrier operating in Dhaka"
          body="ST Global holds air waybill stock and confirmed space allocation across regular and freighter flights, with dedicated allocation on Emirates, Qatar Airways, Saudia, Etihad, Thai, Turkish, Cathay Pacific, Singapore Airlines, Malaysia Airlines, Kuwait Airways, British Airways and other major carriers."
          tags={AIR_CARRIERS}
          image="/images/air-freight.jpg"
          imageAlt="Air cargo being loaded into a freighter aircraft"
        />
        <FeatureBlock
          eyebrow="Ocean freight"
          reverse
          title="24/7 CFS operations inside Chittagong's two largest container freight stations"
          body="Our fastest-growing department runs on partnerships with ONE, APL, HPL, CMA CGM, MSC, Maersk, HMM, OOCL, COSCO, EMC and YML. The Chittagong branch office manages day-to-day port operations from our own CFS warehouses, around the clock."
          tags={OCEAN_CARRIERS}
          image="/images/ocean-freight.jpg"
          imageAlt="Container ship loaded with shipping containers"
        />
      </section>

      {/* NETWORK / OFFICES */}
      <section id="network" className="relative overflow-hidden border-b border-line bg-ink py-20 text-paper">
        <div className="yard-grid absolute inset-0 -z-10" aria-hidden />
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow dark>Network</SectionEyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {content.offices.heading}
          </h2>
          <div className="mt-10">
            <RouteManifest dark />
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
            {content.offices.offices.map((o) => (
              <div key={o.name} className="bg-ink p-6">
                <h3 className="font-display text-base font-semibold text-paper">{o.name}</h3>
                <div className="mt-3 space-y-0.5 text-sm text-paper/60">
                  {o.lines.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
                <div className="mt-4 space-y-1 border-t border-white/10 pt-3 font-mono text-[11px] text-paper/70">
                  <p>{o.phone}</p>
                  <p className="text-royalLight">{o.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPANY PROFILE — styled like the registration document */}
      <section id="profile" className="relative overflow-hidden border-b border-line py-20">
        <div className="pointer-events-none absolute right-0 top-0 h-[380px] w-full max-w-2xl opacity-70">
          <WorldMapPortArt className="h-full w-full" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <SectionEyebrow>Company profile</SectionEyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              {content.profile.heading}
            </h2>
            <p className="mt-5 border-l-2 border-royal py-1 pl-4 text-[15px] leading-relaxed text-ink/65">
              {content.profile.intro}
            </p>
          </div>

          <div className="mt-10 overflow-hidden border border-line bg-white shadow-sm shadow-ink/5">
            <div className="grid grid-cols-[1fr_1.4fr] bg-royal px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-white md:grid-cols-[300px_1fr]">
              <span>Details</span>
              <span>Information</span>
            </div>
            {content.profile.rows.map((row, i) => {
              const Icon = PROFILE_ICONS[i] ?? ShieldCheckIcon;
              return (
                <div
                  key={row.label + i}
                  className={`grid grid-cols-[1fr_1.4fr] items-center gap-4 px-6 py-4 text-sm md:grid-cols-[300px_1fr] ${
                    i % 2 === 1 ? "bg-paper/70" : "bg-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-royal/10 text-royal">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-royal/80">{row.label}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="font-medium text-ink">{row.value}</span>
                    {row.badge && (
                      <span className="flex items-center gap-1 rounded-full border border-royal/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-royal">
                        <ShieldCheckIcon className="h-3 w-3" />
                        {row.badge}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal text-white">
                  <b.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-[13px] font-semibold leading-tight text-ink">{b.title}</p>
                  <p className="text-[12px] text-ink/55">{b.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KEY CONTACTS */}
      <section id="contacts" className="border-b border-line py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionEyebrow>Key contacts</SectionEyebrow>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {content.contacts.heading}
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {content.contacts.contacts.map((c) => (
              <div key={c.name} className="bg-paper p-6">
                <h3 className="font-display text-[15px] font-semibold leading-tight">{c.name}</h3>
                <p className="mt-1 text-xs text-ink/55">{c.role}</p>
                <div className="mt-4 space-y-1 font-mono text-[11px] text-ink/70">
                  <p>{c.phone}</p>
                  <p className="text-royal">{c.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / FOOTER CTA */}
      <section id="contact" className="bg-ink py-20 text-paper">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-[1.2fr_1fr]">
            <div>
              <SectionEyebrow dark>Get a quote</SectionEyebrow>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {content.footer.heading}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/65">
                {content.footer.body}
              </p>
              <div className="mt-8 space-y-2 font-mono text-sm">
                <p className="text-paper">{content.footer.address}</p>
                <p className="text-royalLight">{content.footer.email}</p>
                <p className="text-paper/80">{content.footer.phone}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 border border-white/15 bg-white/5 p-6">
              <a
                href="/booking"
                className="border border-royal bg-royal py-3.5 text-center font-mono text-[12px] uppercase tracking-wider text-paper transition-colors hover:bg-transparent hover:text-royalLight"
              >
                Book a shipment
              </a>
              <a
                href="/tracking"
                className="border border-white/25 py-3.5 text-center font-mono text-[12px] uppercase tracking-wider text-paper transition-colors hover:border-white/60"
              >
                Track an existing shipment
              </a>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-paper/45 md:flex-row">
            <span>© {new Date().getFullYear()} ST Global Forwarding. All rights reserved.</span>
            <span className="font-mono">{content.footer.copyrightLine}</span>
          </div>
        </div>
      </section>
    </main>
  );
}



function FeatureBlock({
  eyebrow,
  title,
  body,
  tags,
  image,
  imageAlt,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
  image: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div
        className={`grid items-center gap-12 md:grid-cols-2 ${
          reverse ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        <div className="relative aspect-[4/3] overflow-hidden border border-line">
          <Image src={image} alt={imageAlt} fill className="object-cover" />
        </div>
        <div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight md:text-[1.75rem]">
            {title}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-ink/65">{body}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink/60"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

