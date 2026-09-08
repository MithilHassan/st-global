"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MailIcon, PhoneIcon, ChevronDownIcon, MapPinIcon, TwitterIcon, InstagramIcon, LinkedinIcon, FacebookIcon } from "@/components/icons";
import { CORE_SERVICES } from "@/lib/site-data";

const LINKS = [
  { href: "/#network", label: "Network" },
  { href: "/#profile", label: "Company profile" },
];

const SOCIAL_DEFAULTS = { twitter: "#", instagram: "#", linkedin: "#", facebook: "#" };
const SOCIAL_ICONS = [
  { key: "twitter" as const, Icon: TwitterIcon },
  { key: "instagram" as const, Icon: InstagramIcon },
  { key: "linkedin" as const, Icon: LinkedinIcon },
  { key: "facebook" as const, Icon: FacebookIcon },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [social, setSocial] = useState(SOCIAL_DEFAULTS);

  useEffect(() => {
    fetch("/api/content/social", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.social) setSocial(data.social);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="hidden bg-ink text-white/85 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-[12px]">
          <div className="flex items-center gap-5">
            <a href="mailto:info@stbd.net" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <MailIcon className="h-3.5 w-3.5" />
              info@stbd.net
            </a>
            <span className="h-3.5 w-px bg-white/25" />
            <a href="tel:+8801719089697" className="flex items-center gap-1.5 transition-colors hover:text-white">
              <PhoneIcon className="h-3.5 w-3.5" />
              +880 1719-089697
            </a>
          </div>
          <div className="flex items-center gap-3">
            {SOCIAL_ICONS.filter(({ key }) => social[key] !== "").map(({ key, Icon }) => (
              <a
                key={key}
                href={social[key] || "#"}
                target={social[key] && social[key] !== "#" ? "_blank" : undefined}
                rel={social[key] && social[key] !== "#" ? "noopener noreferrer" : undefined}
                aria-label={`${key[0].toUpperCase()}${key.slice(1)}`}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <Icon className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <div className="border-b border-line/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="ST Global Forwarding logo" width={36} height={34} className="h-9 w-auto" />
            <span className="font-display text-[15px] font-semibold leading-tight tracking-tight text-ink">
              ST GLOBAL
              <span className="block text-[10px] font-medium tracking-[0.2em] text-royal">FORWARDING</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <div ref={servicesRef} className="relative">
              <button
                onClick={() => setServicesOpen((v) => !v)}
                className="flex items-center gap-1 font-mono text-[12px] uppercase tracking-wider text-ink/70 transition-colors hover:text-royal"
                aria-expanded={servicesOpen}
              >
                Services
                <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
              </button>
              {servicesOpen && (
                <div className="absolute left-1/2 top-full mt-3 w-80 -translate-x-1/2 border border-line bg-white shadow-xl shadow-ink/10">
                  {CORE_SERVICES.map((s) => (
                    <a
                      key={s.code}
                      href="/#services"
                      onClick={() => setServicesOpen(false)}
                      className="flex items-start gap-3 border-b border-line/60 px-4 py-3 last:border-b-0 hover:bg-paper"
                    >
                      <span className="font-mono text-[10px] text-royal/70">{s.code}</span>
                      <span>
                        <span className="block text-[13px] font-semibold text-ink">{s.title}</span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-ink/55">{s.detail}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="font-mono text-[12px] uppercase tracking-wider text-ink/70 transition-colors hover:text-royal"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <a
            href="/tracking"
            className="hidden shrink-0 items-center gap-2 border border-royal bg-royal px-4 py-2.5 font-mono text-[12px] uppercase tracking-wider text-white transition-colors hover:bg-royalLight hover:border-royalLight hover:text-ink md:inline-flex"
          >
            <MapPinIcon className="h-4 w-4" />
            Track shipment
          </a>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 border border-ink/30 md:hidden"
          >
            <span className={`h-[1.5px] w-5 bg-ink transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-[1.5px] w-5 bg-ink transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col border-t border-line bg-paper px-6 py-4 md:hidden">
          <a href="mailto:info@stbd.net" className="flex items-center gap-2 border-b border-line/60 py-3 text-[13px] text-ink/80">
            <MailIcon className="h-4 w-4" /> info@stbd.net
          </a>
          <a href="tel:+8801719089697" className="flex items-center gap-2 border-b border-line/60 py-3 text-[13px] text-ink/80">
            <PhoneIcon className="h-4 w-4" /> +880 1719-089697
          </a>
          <a
            href="/#services"
            onClick={() => setOpen(false)}
            className="border-b border-line/60 py-3 font-mono text-[13px] uppercase tracking-wider text-ink/80"
          >
            Services
          </a>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-line/60 py-3 font-mono text-[13px] uppercase tracking-wider text-ink/80"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/booking"
            onClick={() => setOpen(false)}
            className="mt-4 border border-ink bg-ink py-3 text-center font-mono text-[12px] uppercase tracking-wider text-paper"
          >
            Book a shipment
          </a>
          <a
            href="/tracking"
            onClick={() => setOpen(false)}
            className="mt-3 border border-royal bg-royal py-3 text-center font-mono text-[12px] uppercase tracking-wider text-white"
          >
            Track a shipment
          </a>
        </nav>
      )}
    </header>
  );
}
