"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Building2,
  DollarSign,
  Wallet,
  Boxes,
  ChevronRight,
  FileText,
} from "lucide-react";
import AdminShell from "./AdminShell";
import { StatusPill, RoutePath, relativeTime, formatUSD, buildArrivedNotifications } from "./shared";

interface CustomerBooking {
  id: string;
  tracking_number: string;
  status: string;
  origin: string;
  destination: string;
  created_at: string;
}

interface CustomerInvoice {
  id: string;
  invoice_number: string | null;
  total: number;
  paid: number;
}

interface Customer {
  key: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  bookings: CustomerBooking[];
  invoices: CustomerInvoice[];
  lastBookingAt: string;
  totalInvoiced: number;
  totalPaid: number;
}

export default function AdminCustomers() {
  const [rawBookings, setRawBookings] = useState<any[] | null>(null);
  const [rawInvoices, setRawInvoices] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [bookingsRes, invoicesRes] = await Promise.all([
          fetch("/api/admin/bookings", { cache: "no-store" }),
          fetch("/api/admin/invoices", { cache: "no-store" }),
        ]);
        const bookingsData = await bookingsRes.json();
        const invoicesData = await invoicesRes.json();
        if (!bookingsRes.ok) throw new Error(bookingsData.error ?? "Failed to load bookings.");
        if (!invoicesRes.ok) throw new Error(invoicesData.error ?? "Failed to load invoices.");
        setRawBookings(bookingsData.bookings);
        setRawInvoices(invoicesData.invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load customers.");
      }
    })();
  }, []);

  const customers = useMemo(() => {
    if (!rawBookings || !rawInvoices) return null;

    const byKey = new Map<string, Customer>();
    const bookingIdToKey = new Map<string, string>();

    for (const b of rawBookings) {
      const key = (b.shipper_email || b.shipper_name || b.id).toLowerCase().trim();
      bookingIdToKey.set(b.id, key);
      let c = byKey.get(key);
      if (!c) {
        c = {
          key,
          name: b.shipper_name,
          company: b.shipper_company,
          email: b.shipper_email,
          phone: b.shipper_phone,
          bookings: [],
          invoices: [],
          lastBookingAt: b.created_at,
          totalInvoiced: 0,
          totalPaid: 0,
        };
        byKey.set(key, c);
      }
      c.bookings.push({
        id: b.id,
        tracking_number: b.tracking_number,
        status: b.status,
        origin: b.origin,
        destination: b.destination,
        created_at: b.created_at,
      });
      if (new Date(b.created_at).getTime() > new Date(c.lastBookingAt).getTime()) {
        c.lastBookingAt = b.created_at;
      }
      // Prefer the most recently-seen company/phone in case it changed across bookings.
      if (b.shipper_company) c.company = b.shipper_company;
    }

    for (const inv of rawInvoices) {
      const key = inv.booking_id ? bookingIdToKey.get(inv.booking_id) : null;
      if (!key) continue;
      const c = byKey.get(key);
      if (!c) continue;
      const total = (inv.line_items || []).reduce(
        (sum: number, li: { unit: number; unitPrice: number }) =>
          sum + (Number(li.unit) || 0) * (Number(li.unitPrice) || 0),
        0
      );
      const paid = Number(inv.paid) || 0;
      c.invoices.push({ id: inv.id, invoice_number: inv.invoice_number, total, paid });
      c.totalInvoiced += total;
      c.totalPaid += paid;
    }

    return Array.from(byKey.values()).sort(
      (a, b) => new Date(b.lastBookingAt).getTime() - new Date(a.lastBookingAt).getTime()
    );
  }, [rawBookings, rawInvoices]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return null;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.company, c.email, c.phone].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const selected = customers?.find((c) => c.key === selectedKey) ?? null;
  const arrivedNotifications = useMemo(
    () => buildArrivedNotifications(rawBookings ?? []),
    [rawBookings]
  );

  return (
    <AdminShell
      active="customers"
      eyebrow="Operations"
      title="Customers"
      search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search customers…" }}
      notifications={arrivedNotifications}
    >
      {error && (
        <p className="mb-6 border border-signal/40 bg-signal/5 px-4 py-3 text-sm text-ink">{error}</p>
      )}

      {!customers ? (
        <p className="text-sm text-ink/50">Loading customers…</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-ink/50">No customers yet — they'll appear here once bookings come in.</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="border border-line bg-white p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, company, email, phone…"
                className="w-full border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus:border-royal"
              />
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-ink/40">
                {filteredCustomers?.length ?? 0} of {customers.length} customers
              </p>
            </div>

            <div className="mt-3 max-h-[70vh] overflow-y-auto border border-line">
              {filteredCustomers && filteredCustomers.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink/50">No customers match your search.</p>
              ) : (
                filteredCustomers?.map((c) => {
                  const isSelected = selectedKey === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setSelectedKey(c.key)}
                      className={`flex w-full items-center gap-3 border-b border-line px-4 py-3.5 text-left last:border-b-0 transition-colors ${
                        isSelected ? "bg-paperdim" : "bg-white hover:bg-paperdim/50"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-royal/10 font-mono text-xs font-medium text-royal">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{c.name}</span>
                          <span className="shrink-0 font-mono text-[10px] text-ink/35">
                            {relativeTime(c.lastBookingAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink/50">
                          {c.company ? `${c.company} · ` : ""}
                          {c.bookings.length} booking{c.bookings.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ChevronRight size={15} className="shrink-0 text-ink/25" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="border border-line bg-white p-6 xl:sticky xl:top-24 xl:self-start">
            {!selected ? (
              <p className="text-sm text-ink/50">Select a customer to view details.</p>
            ) : (
              <div>
                <div className="flex items-start gap-3 border-b border-line pb-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-royal/10 font-mono text-sm font-medium text-royal">
                    {selected.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold leading-tight">{selected.name}</p>
                    {selected.company && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/60">
                        <Building2 size={13} /> {selected.company}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
                      <Mail size={12} />
                      <a href={`mailto:${selected.email}`} className="hover:underline">{selected.email}</a>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/50">
                      <Phone size={12} />
                      <a href={`tel:${selected.phone}`} className="hover:underline">{selected.phone}</a>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-line py-5">
                  <div>
                    <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-ink/40">
                      <Boxes size={12} /> Bookings
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold">{selected.bookings.length}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-ink/40">
                      <DollarSign size={12} /> Invoiced
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold">{formatUSD(selected.totalInvoiced)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-ink/40">
                      <Wallet size={12} /> Outstanding
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold">
                      {formatUSD(Math.max(0, selected.totalInvoiced - selected.totalPaid))}
                    </p>
                  </div>
                </div>

                <div className="border-b border-line py-5">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                    Bookings ({selected.bookings.length})
                  </p>
                  <div className="mt-3 space-y-2">
                    {[...selected.bookings]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((b) => (
                        <Link
                          key={b.id}
                          href={`/admin?focus=${b.id}`}
                          className="flex items-center gap-3 border border-line px-3 py-2.5 hover:bg-paperdim/50"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] font-medium">{b.tracking_number}</span>
                              <span className="shrink-0 font-mono text-[10px] text-ink/35">
                                {relativeTime(b.created_at)}
                              </span>
                            </div>
                            <div className="mt-1">
                              <RoutePath origin={b.origin} destination={b.destination} />
                            </div>
                          </div>
                          <StatusPill status={b.status} />
                        </Link>
                      ))}
                  </div>
                </div>

                <div className="pt-5">
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                    Invoices ({selected.invoices.length})
                  </p>
                  {selected.invoices.length === 0 ? (
                    <p className="mt-3 text-xs text-ink/50">No invoices for this customer yet.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {selected.invoices.map((inv) => {
                        const isPaid = inv.total > 0 && inv.paid >= inv.total;
                        return (
                          <Link
                            key={inv.id}
                            href={`/admin/invoices/${inv.id}`}
                            className="flex items-center gap-3 border border-line px-3 py-2.5 hover:bg-paperdim/50"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-paper text-ink/50">
                              <FileText size={13} />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {inv.invoice_number ?? "Untitled invoice"}
                            </span>
                            <span className="shrink-0 font-mono text-xs">{formatUSD(inv.total)}</span>
                            <span
                              className={`shrink-0 px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${
                                isPaid ? "bg-success/10 text-success" : "bg-honey/10 text-honey"
                              }`}
                            >
                              {isPaid ? "Paid" : "Unpaid"}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
