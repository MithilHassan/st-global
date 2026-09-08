"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import WorldMapPortArt from "@/components/WorldMapPortArt";
import {
  PackageIcon,
  FileIcon,
  PhoneIcon,
  CheckIcon,
  PlaneIcon,
  MapPinIcon,
  UserIcon,
  BuildingIcon,
  MailIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ClockIcon,
  HeadsetIcon,
  LockIcon,
} from "@/components/icons";

const SERVICE_OPTIONS = [
  "Air Freight (Express & General)",
  "Ocean Freight",
  "Combined Sea/Air & Air/Sea",
  "Customs Brokerage",
  "International Courier Service",
  "Project & Heavylift Shipment",
  "Door-to-Door (DAP/DDP)",
];

const GOODS_TYPE_OPTIONS = [
  "General Cargo",
  "Perishable Goods",
  "Pharmaceutical",
  "Hazardous / Dangerous Goods",
  "Fragile / High-Value",
  "Project / Heavylift",
  "Documents",
  "Personal Effects / Used Goods",
];

const STEPS = [
  { n: 1, label: "Service", icon: PackageIcon },
  { n: 2, label: "Details", icon: FileIcon },
  { n: 3, label: "Contact", icon: PhoneIcon },
  { n: 4, label: "Review", icon: CheckIcon },
];

type FormState = {
  service: string;
  goodsType: string;
  specialInstructions: string;
  origin: string;
  destination: string;
  grossWeight: string;
  packages: string;
  dimensions: string;
  shippingAddress: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
};

const INITIAL: FormState = {
  service: "",
  goodsType: "",
  specialInstructions: "",
  origin: "",
  destination: "",
  grossWeight: "",
  packages: "1",
  dimensions: "",
  shippingAddress: "",
  fullName: "",
  companyName: "",
  email: "",
  phone: "",
};

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!form.service) return "Please choose a service.";
      if (!form.goodsType) return "Please select the type of goods.";
    }
    if (current === 2) {
      if (!form.origin.trim()) return "Origin is required.";
      if (!form.destination.trim()) return "Destination is required.";
      if (!form.grossWeight || Number(form.grossWeight) <= 0)
        return "Enter a gross weight greater than zero.";
      if (!form.packages || Number(form.packages) < 1)
        return "Enter at least one package.";
    }
    if (current === 3) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.shippingAddress.trim()) return "Shipping address is required.";
      if (!form.email.trim()) return "Email address is required.";
      if (!form.phone.trim()) return "Phone number is required.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, 4));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitStatus("submitting");
    setSubmitError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong submitting the booking. Please try again.");
      }

      setTrackingNumber(data.trackingNumber as string);
      setSubmitStatus("idle");
      setForm(INITIAL);
      setStep(1);
    } catch (err) {
      setSubmitStatus("error");
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong submitting the booking. Please try again."
      );
    }
  }

  if (trackingNumber) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 py-24">
          <div className="perforated border border-ink/15 bg-white/70 px-8 py-10 text-center">
            <span className="font-mono text-[11px] uppercase tracking-widest text-teal">
              Booking confirmed
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
              Your tracking number is
            </h1>
            <p className="mt-4 font-mono text-2xl tracking-wider text-royal">
              {trackingNumber}
            </p>
            <p className="mt-6 text-sm leading-relaxed text-ink/65">
              Save this number — you'll need it to follow your shipment's
              status. Our team will confirm space and rates by email shortly.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={`/tracking?ref=${trackingNumber}`}
                className="border border-ink bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal"
              >
                Track this shipment
              </Link>
              <button
                onClick={() => setTrackingNumber(null)}
                className="border border-ink/30 px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-ink transition-colors hover:border-ink"
              >
                Book another shipment
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Nav />

      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-[320px] w-full max-w-2xl opacity-70">
          <WorldMapPortArt className="h-full w-full" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 pt-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-royal">New booking</span>
          <span className="mt-2 block h-0.5 w-8 bg-royal" />
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Request a shipment booking
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/65">
            Tell us the cargo and route — we'll confirm space, rates and documentation by email or phone.
          </p>

          <Stepper current={step} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16">
        <div className="mt-8 border border-line bg-white/60 p-6 shadow-sm shadow-ink/5 md:p-10">
          {step === 1 && (
            <StepPanel
              title="Select Service Type"
              subtitle="Choose the service that best matches your shipment."
              icon={PackageIcon}
            >
              <div className="space-y-6">
                <SelectField
                  label="Service"
                  required
                  value={form.service}
                  onChange={(v) => update("service", v)}
                  options={SERVICE_OPTIONS}
                  placeholder="Choose a service…"
                  icon={PlaneIcon}
                />
                <SelectField
                  label="Type of Goods"
                  required
                  value={form.goodsType}
                  onChange={(v) => update("goodsType", v)}
                  options={GOODS_TYPE_OPTIONS}
                  placeholder="Select goods type…"
                  icon={PackageIcon}
                />
                <Field
                  label="Special Instructions"
                  value={form.specialInstructions}
                  onChange={(v) => update("specialInstructions", v)}
                  placeholder="Any specific requirements…"
                  textarea
                  icon={FileIcon}
                />
              </div>
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel title="Shipment Details" subtitle="Cargo weight, size and the route it's travelling." icon={FileIcon}>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Origin (City, Country)"
                  required
                  value={form.origin}
                  onChange={(v) => update("origin", v)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  icon={MapPinIcon}
                />
                <Field
                  label="Destination (City, Country)"
                  required
                  value={form.destination}
                  onChange={(v) => update("destination", v)}
                  placeholder="e.g. London, UK"
                  icon={MapPinIcon}
                />
                <Field
                  label="Gross Weight (kg)"
                  required
                  type="number"
                  value={form.grossWeight}
                  onChange={(v) => update("grossWeight", v)}
                  placeholder="0.0"
                />
                <Field
                  label="Number of Packages"
                  required
                  type="number"
                  value={form.packages}
                  onChange={(v) => update("packages", v)}
                  placeholder="1"
                  icon={PackageIcon}
                />
                <Field
                  label="Dimensions (L x W x H in cm)"
                  value={form.dimensions}
                  onChange={(v) => update("dimensions", v)}
                  placeholder="e.g. 120 x 80 x 100"
                  className="sm:col-span-2"
                />
              </div>
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel title="Contact Information" subtitle="Who should we confirm space and rates with?" icon={PhoneIcon}>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field
                  label="Full Name"
                  required
                  value={form.fullName}
                  onChange={(v) => update("fullName", v)}
                  placeholder="Your Name"
                  className="sm:col-span-2"
                  icon={UserIcon}
                />
                <Field
                  label="Company Name"
                  value={form.companyName}
                  onChange={(v) => update("companyName", v)}
                  placeholder="Company Name (Optional)"
                  className="sm:col-span-2"
                  icon={BuildingIcon}
                />
                <Field
                  label="Shipping Address"
                  required
                  textarea
                  value={form.shippingAddress}
                  onChange={(v) => update("shippingAddress", v)}
                  placeholder="Street address, city, and any pickup/delivery notes"
                  className="sm:col-span-2"
                  icon={MapPinIcon}
                />
                <Field
                  label="Email Address"
                  required
                  type="email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  placeholder="email@example.com"
                  icon={MailIcon}
                />
                <Field
                  label="Phone Number"
                  required
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                  placeholder="+880 …"
                  icon={PhoneIcon}
                />
              </div>
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel title="Review Your Booking" subtitle="Check the details below before you submit." icon={CheckIcon}>
              <div className="overflow-hidden border border-line">
                {[
                  ["Service", form.service],
                  ["Type of goods", form.goodsType],
                  ["Special instructions", form.specialInstructions || "—"],
                  ["Origin", form.origin],
                  ["Destination", form.destination],
                  ["Gross weight", `${form.grossWeight} kg`],
                  ["Number of packages", form.packages],
                  ["Dimensions", form.dimensions || "—"],
                  ["Full name", form.fullName],
                  ["Company", form.companyName || "—"],
                  ["Shipping address", form.shippingAddress],
                  ["Email", form.email],
                  ["Phone", form.phone],
                ].map(([label, value], i) => (
                  <div
                    key={label}
                    className={`grid grid-cols-[160px_1fr] gap-4 px-5 py-3 text-sm sm:grid-cols-[220px_1fr] ${
                      i % 2 === 1 ? "bg-paper" : "bg-white"
                    }`}
                  >
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                      {label}
                    </span>
                    <span className="font-medium text-ink">{value}</span>
                  </div>
                ))}
              </div>

              {submitError && (
                <p className="mt-6 border border-royal/40 bg-royal/10 px-4 py-3 text-sm text-ink">
                  {submitError}
                </p>
              )}
            </StepPanel>
          )}

          {stepError && (
            <p className="mt-6 border border-royal/40 bg-royal/10 px-4 py-3 text-sm text-ink">
              {stepError}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="border border-ink/30 px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-ink transition-colors hover:border-ink"
              >
                ← Previous
              </button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-2 border border-royal bg-royal px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-white transition-colors hover:bg-royalLight hover:border-royalLight hover:text-ink"
              >
                {step === 3 ? "Review" : "Next step"}
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitStatus === "submitting"}
                className="flex items-center gap-2 border border-royal bg-royal px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-white transition-colors hover:bg-royalLight hover:border-royalLight hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitStatus === "submitting" ? "Submitting…" : "Submit booking"}
                {submitStatus !== "submitting" && <ArrowRightIcon className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border border-line bg-white/60 px-6 py-6 sm:grid-cols-4">
          {[
            { icon: ShieldCheckIcon, title: "Secure & safe", subtitle: "Your data is protected" },
            { icon: ClockIcon, title: "Quick response", subtitle: "We reply promptly" },
            { icon: HeadsetIcon, title: "Expert support", subtitle: "Our team is here to help" },
            { icon: LockIcon, title: "Confidential", subtitle: "100% confidentiality" },
          ].map((b) => (
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
    </main>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="mt-10 flex items-center">
      {STEPS.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-medium transition-colors ${
                  done ? "bg-teal text-paper" : active ? "bg-royal text-paper" : "bg-white text-ink/40 ring-1 ring-inset ring-line"
                }`}
              >
                {s.n}
              </span>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                  active
                    ? "border-royal bg-royal/10 text-royal"
                    : done
                    ? "border-teal/40 bg-teal/10 text-teal"
                    : "border-line bg-paperdim text-ink/35"
                }`}
              >
                <s.icon className="h-4 w-4" />
              </span>
              <span
                className={`hidden font-mono text-[11px] uppercase tracking-wider sm:inline ${
                  active ? "text-royal" : done ? "text-ink/70" : "text-ink/35"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`mx-3 h-px flex-1 ${done ? "bg-teal" : "bg-line"}`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepPanel({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: (props: { className?: string }) => React.ReactElement;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-4">
        {Icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-royal/10 text-royal">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink/55">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  textarea = false,
  className = "",
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  textarea?: boolean;
  className?: string;
  icon?: (props: { className?: string }) => React.ReactElement;
}) {
  const common = `w-full border border-line bg-white py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-royal ${
    Icon ? "pl-10 pr-3" : "px-3"
  }`;
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-royal/80">
        {label}
        {required && <span className="text-royal"> *</span>}
      </span>
      <span className="relative block">
        {Icon && (
          <Icon
            className={`pointer-events-none absolute left-3 h-4 w-4 text-ink/35 ${
              textarea ? "top-3.5" : "top-1/2 -translate-y-1/2"
            }`}
          />
        )}
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder={placeholder}
            className={common}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={common}
          />
        )}
      </span>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  icon?: (props: { className?: string }) => React.ReactElement;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-royal/80">
        {label}
        {required && <span className="text-royal"> *</span>}
      </span>
      <span className="relative block">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none border border-line bg-white py-2.5 pr-10 text-sm focus:border-royal ${
            Icon ? "pl-10" : "px-3"
          } ${value ? "text-ink" : "text-ink/40"}`}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="text-ink">
              {o}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
      </span>
    </label>
  );
}
