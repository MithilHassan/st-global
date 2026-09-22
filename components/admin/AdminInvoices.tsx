"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight, DollarSign } from "lucide-react";
import AdminShell from "./AdminShell";
import { relativeTime } from "./shared";

interface InvoiceLineItem {
  unit: number;
  unitPrice: number;
}

interface AdminInvoice {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  line_items: InvoiceLineItem[];
  paid: number;
  currency: string | null;
  balance_type: string | null;
  booking_id: string | null;
  created_at: string;
  shipper: string | null;
  consignee: string | null;
  bookings: { tracking_number: string; origin: string; destination: string } | null;
}

type StatusFilter = "all" | "paid" | "due" | "discount";

function invoiceTotal(inv: AdminInvoice): number {
  return (inv.line_items ?? []).reduce(
    (sum, li) => sum + (Number(li.unit) || 0) * (Number(li.unitPrice) || 0),
    0
  );
}

function invoiceStatus(inv: AdminInvoice, total: number): "paid" | "due" | "discount" {
  if (total <= 0 || Number(inv.paid) >= total) return "paid";
  return inv.balance_type === "discount" ? "discount" : "due";
}

function formatMoney(amount: number, currency: string | null): string {
  return `${currency || "USD"} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  paid: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Paid" },
  due: { bg: "bg-honey/10", text: "text-honey", dot: "bg-honey", label: "Due" },
  discount: { bg: "bg-royal/10", text: "text-royal", dot: "bg-royal", label: "Discount" },
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<AdminInvoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load invoices.");
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const enriched = useMemo(() => {
    if (!invoices) return null;
    return invoices.map((inv) => {
      const total = invoiceTotal(inv);
      return { inv, total, status: invoiceStatus(inv, total) };
    });
  }, [invoices]);

  const counts = useMemo(() => {
    if (!enriched) return null;
    return {
      total: enriched.length,
      paid: enriched.filter((e) => e.status === "paid").length,
      due: enriched.filter((e) => e.status === "due").length,
      discount: enriched.filter((e) => e.status === "discount").length,
    };
  }, [enriched]);

  const filtered = useMemo(() => {
    if (!enriched) return null;
    const q = searchQuery.trim().toLowerCase();
    let result = enriched.filter(({ inv, status }) => {
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (q) {
        const haystack = [
          inv.invoice_number,
          inv.bookings?.tracking_number,
          inv.shipper,
          inv.consignee,
          inv.bookings?.origin,
          inv.bookings?.destination,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    result = [...result].sort((a, b) => {
      if (sortBy === "amount") return b.total - a.total;
      const diff = new Date(b.inv.created_at).getTime() - new Date(a.inv.created_at).getTime();
      return sortBy === "oldest" ? -diff : diff;
    });
    return result;
  }, [enriched, searchQuery, statusFilter, sortBy]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!filtered || filtered.length === 0) return;
    const allSelected = filtered.every(({ inv }) => selectedIds.has(inv.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const { inv } of filtered) {
        if (allSelected) next.delete(inv.id);
        else next.add(inv.id);
      }
      return next;
    });
  }

  async function handleMarkPaid() {
    if (!enriched || selectedIds.size === 0) return;
    setBulkApplying(true);
    setBulkNotice(null);
    const targets = enriched.filter(({ inv }) => selectedIds.has(inv.id));

    const results = await Promise.allSettled(
      targets.map(({ inv, total }) =>
        fetch(`/api/admin/invoices/${inv.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paid: total }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Failed to update.");
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;
    setBulkNotice(
      failed === 0
        ? `Marked ${succeeded} invoice${succeeded === 1 ? "" : "s"} as paid.`
        : `Updated ${succeeded} of ${targets.length} — ${failed} failed. Check server logs.`
    );
    setSelectedIds(new Set());
    setBulkApplying(false);
    await load();
  }

  function handleExportCsv() {
    if (!filtered || filtered.length === 0) return;
    const headers = [
      "Invoice number", "Date", "Tracking number", "Shipper", "Consignee",
      "Currency", "Total", "Paid", "Balance", "Status", "Created at",
    ];
    const escapeCsv = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const rows = filtered.map(({ inv, total, status }) => [
      inv.invoice_number ?? "",
      inv.invoice_date ?? "",
      inv.bookings?.tracking_number ?? "",
      inv.shipper ?? "",
      inv.consignee ?? "",
      inv.currency ?? "USD",
      total.toFixed(2),
      Number(inv.paid ?? 0).toFixed(2),
      Math.max(0, total - Number(inv.paid ?? 0)).toFixed(2),
      STATUS_STYLES[status].label,
      inv.created_at,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const allFilteredSelected =
    !!filtered && filtered.length > 0 && filtered.every(({ inv }) => selectedIds.has(inv.id));

  return (
    <AdminShell
      active="invoices"
      eyebrow="Operations"
      title="Invoices"
      search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search invoice #, tracking #, name…" }}
    >
      {error && (
        <p className="mb-6 border border-signal/40 bg-signal/5 px-4 py-3 text-sm text-ink">{error}</p>
      )}

      {counts && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex flex-col justify-between border px-5 py-4 text-left transition-colors ${
              statusFilter === "all" ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className={`font-mono text-[10px] uppercase tracking-wide ${statusFilter === "all" ? "text-paper/60" : "text-ink/40"}`}>
                Total invoices
              </p>
              <span className={`flex h-8 w-8 items-center justify-center ${statusFilter === "all" ? "bg-paper/15" : "bg-royal/10"}`}>
                <FileText size={15} className={statusFilter === "all" ? "text-paper" : "text-royal"} />
              </span>
            </div>
            <p className="mt-1 font-display text-3xl font-semibold">{counts.total}</p>
          </button>

          {(["paid", "due", "discount"] as const).map((key) => {
            const style = STATUS_STYLES[key];
            const active = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(active ? "all" : key)}
                className={`flex flex-col justify-between border px-5 py-4 text-left transition-colors ${
                  active ? "border-ink bg-paperdim" : "border-line bg-white hover:border-ink/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">{style.label}</p>
                  <span className={`flex h-8 w-8 items-center justify-center ${style.bg}`}>
                    <DollarSign size={15} className={style.text} />
                  </span>
                </div>
                <p className="mt-1 font-display text-3xl font-semibold">{counts[key]}</p>
              </button>
            );
          })}
        </section>
      )}

      {!invoices ? (
        <p className="mt-10 text-sm text-ink/50">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <p className="mt-10 text-sm text-ink/50">No invoices yet — generate one from a booking's detail panel.</p>
      ) : (
        <div className="mt-6">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border border-line bg-white p-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice #, tracking #, shipper, consignee…"
                className="min-w-[220px] flex-1 border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus:border-royal"
              />
              <button
                onClick={handleExportCsv}
                disabled={!filtered || filtered.length === 0}
                className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink/70 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="flex-1 border border-line bg-white px-2 py-1.5 text-xs focus:border-royal"
              >
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
                <option value="discount">Discount</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "amount")}
                className="border border-line bg-white px-2 py-1.5 text-xs focus:border-royal"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount">Highest amount</option>
              </select>
            </div>
          </div>

          {/* Select-all / count bar */}
          <div className="mt-3 flex items-center justify-between gap-3 border border-line bg-white px-4 py-2.5">
            <label className="flex items-center gap-2 text-xs text-ink/60">
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="h-4 w-4 border-line accent-royal" />
              {filtered?.length ?? 0} of {invoices.length} invoices
            </label>
            {selectedIds.size > 0 && (
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink/50">{selectedIds.size} selected</span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-3 border border-ink bg-white p-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                Bulk action — {selectedIds.size} invoice{selectedIds.size === 1 ? "" : "s"}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleMarkPaid}
                  disabled={bulkApplying}
                  className="flex-1 border border-ink bg-ink py-2 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {bulkApplying ? "Applying…" : "Mark selected as paid"}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkApplying}
                  className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink/60 transition-colors hover:border-ink disabled:opacity-60"
                >
                  Clear
                </button>
              </div>
              {bulkNotice && <p className="mt-3 text-xs text-ink/60">{bulkNotice}</p>}
            </div>
          )}

          {/* List */}
          <div className="mt-3 border border-line">
            {filtered && filtered.length === 0 ? (
              <p className="px-5 py-6 text-sm text-ink/50">No invoices match your search or filters.</p>
            ) : (
              filtered?.map(({ inv, total, status }) => {
                const style = STATUS_STYLES[status];
                return (
                  <div key={inv.id} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-paperdim/50">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 shrink-0 border-line accent-royal"
                    />
                    <Link href={`/admin/invoices/${inv.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-paper text-ink/50">
                        <FileText size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {inv.invoice_number ?? "Untitled invoice"}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-ink/35">{relativeTime(inv.created_at)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink/50">
                          {inv.bookings?.tracking_number ?? "No linked booking"}
                          {inv.shipper ? ` · ${inv.shipper}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm">{formatMoney(total, inv.currency)}</span>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium ${style.bg} ${style.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-ink/25" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
