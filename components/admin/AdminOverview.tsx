"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Ship, DollarSign, Wallet, ChevronRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { STATUS_STAGES } from "@/lib/types";
import AdminShell from "./AdminShell";
import { StatusPill, RoutePath, relativeTime, formatUSD, buildArrivedNotifications } from "./shared";

interface OverviewBooking {
  id: string;
  tracking_number: string;
  status: string;
  origin: string;
  destination: string;
  shipper_name: string;
  shipper_company: string | null;
  created_at: string;
  booking_events?: { status: string; occurred_at: string }[];
}

interface OverviewInvoiceLineItem {
  unit: number;
  unitPrice: number;
}

interface OverviewInvoice {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  line_items: OverviewInvoiceLineItem[];
  paid: number;
  created_at: string;
  bookings: { tracking_number: string; origin: string; destination: string } | null;
}

// Hex values mirroring tailwind.config.ts — recharts needs literal colors,
// not Tailwind classes.
const STATUS_COLORS: Record<string, string> = {
  booking_received: "#9AA3EC",
  cargo_received: "#1C6E71",
  customs_clearance: "#291B8D",
  in_transit: "#B76E00",
  arrived: "#123A57",
  delivered: "#1F7A4D",
};
const LINE_COLOR = "#C7CCC3";
const TREND_COLOR = "#291B8D";

const TREND_DAYS = 14;

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-line bg-white px-3 py-2 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="mt-0.5 text-xs font-medium text-ink">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const [bookings, setBookings] = useState<OverviewBooking[] | null>(null);
  const [invoices, setInvoices] = useState<OverviewInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setBookings(bookingsData.bookings);
        setInvoices(invoicesData.invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      }
    })();
  }, []);

  const stats = useMemo(() => {
    if (!bookings || !invoices) return null;

    const perStatus = new Map<string, number>();
    for (const stage of STATUS_STAGES) perStatus.set(stage.key, 0);
    for (const b of bookings) perStatus.set(b.status, (perStatus.get(b.status) ?? 0) + 1);

    const activeShipments = bookings.filter((b) => b.status !== "delivered").length;

    let totalInvoiced = 0;
    let totalPaid = 0;
    for (const inv of invoices) {
      const invTotal = inv.line_items.reduce(
        (sum, li) => sum + (Number(li.unit) || 0) * (Number(li.unitPrice) || 0),
        0
      );
      totalInvoiced += invTotal;
      totalPaid += Number(inv.paid) || 0;
    }
    const outstanding = totalInvoiced - totalPaid;

    // Bookings created per day, last 14 days (including empty days as 0).
    const dayBuckets: { date: string; label: string; count: number }[] = [];
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      dayBuckets.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count: 0,
      });
    }
    const bucketByDate = new Map(dayBuckets.map((d) => [d.date, d]));
    for (const b of bookings) {
      const date = new Date(b.created_at).toISOString().slice(0, 10);
      const bucket = bucketByDate.get(date);
      if (bucket) bucket.count++;
    }

    const statusChartData = STATUS_STAGES.map((s) => ({
      label: s.label,
      count: perStatus.get(s.key) ?? 0,
      color: STATUS_COLORS[s.key] ?? LINE_COLOR,
    }));

    return { perStatus, activeShipments, totalInvoiced, totalPaid, outstanding, dayBuckets, statusChartData };
  }, [bookings, invoices]);

  const recentBookings = bookings?.slice(0, 6) ?? [];
  const arrivedNotifications = useMemo(() => buildArrivedNotifications(bookings ?? []), [bookings]);

  return (
    <AdminShell active="dashboard" eyebrow="Operations" title="Dashboard" notifications={arrivedNotifications}>
      {error && (
        <p className="mb-6 border border-signal/40 bg-signal/5 px-4 py-3 text-sm text-ink">{error}</p>
      )}

      {!bookings || !invoices || !stats ? (
        <p className="text-sm text-ink/50">Loading dashboard…</p>
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="border border-line bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">Total bookings</p>
                <span className="flex h-8 w-8 items-center justify-center bg-royal/10">
                  <Boxes size={15} className="text-royal" />
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-semibold">{bookings.length}</p>
            </div>
            <div className="border border-line bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">Active shipments</p>
                <span className="flex h-8 w-8 items-center justify-center bg-marine/10">
                  <Ship size={15} className="text-marine" />
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-semibold">{stats.activeShipments}</p>
              <p className="mt-1 text-[11px] text-ink/50">Not yet delivered</p>
            </div>
            <div className="border border-line bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">Total invoiced</p>
                <span className="flex h-8 w-8 items-center justify-center bg-teal/10">
                  <DollarSign size={15} className="text-teal" />
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-semibold">{formatUSD(stats.totalInvoiced)}</p>
              <p className="mt-1 text-[11px] text-ink/50">Across {invoices.length} invoice{invoices.length === 1 ? "" : "s"}</p>
            </div>
            <div className="border border-line bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">Outstanding balance</p>
                <span className="flex h-8 w-8 items-center justify-center bg-signal/10">
                  <Wallet size={15} className="text-signal" />
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-semibold">{formatUSD(Math.max(0, stats.outstanding))}</p>
              <p className="mt-1 text-[11px] text-ink/50">{formatUSD(stats.totalPaid)} collected so far</p>
            </div>
          </section>

          {/* Charts */}
          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="border border-line bg-white p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                Bookings, last {TREND_DAYS} days
              </p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dayBuckets} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={LINE_COLOR} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#0B1E33", opacity: 0.5 }}
                      axisLine={{ stroke: LINE_COLOR }}
                      tickLine={false}
                      interval={1}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#0B1E33", opacity: 0.5 }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Bookings"
                      stroke={TREND_COLOR}
                      strokeWidth={2}
                      fill="url(#trendFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-line bg-white p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                Shipments by stage
              </p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.statusChartData}
                    layout="vertical"
                    margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid stroke={LINE_COLOR} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#0B1E33", opacity: 0.5 }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={110}
                      tick={{ fontSize: 10, fill: "#0B1E33", opacity: 0.7 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#E7EAE1" }} />
                    <Bar dataKey="count" name="Shipments" radius={[0, 2, 2, 0]}>
                      {stats.statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Recent activity */}
          <section className="border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">Recent bookings</p>
              <Link href="/admin" className="font-mono text-[10px] uppercase tracking-wide text-royal hover:underline">
                View all
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink/50">No bookings yet.</p>
            ) : (
              recentBookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin?focus=${b.id}`}
                  className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0 hover:bg-paperdim/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-medium">{b.tracking_number}</span>
                      <span className="shrink-0 font-mono text-[10px] text-ink/35">{relativeTime(b.created_at)}</span>
                    </div>
                    <div className="mt-1">
                      <RoutePath origin={b.origin} destination={b.destination} />
                    </div>
                  </div>
                  <StatusPill status={b.status} />
                  <ChevronRight size={15} className="shrink-0 text-ink/25" />
                </Link>
              ))
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
