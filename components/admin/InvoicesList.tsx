"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  bill_to: string | null;
  line_items: { amount: number }[];
  paid: number;
  bookings: { tracking_number: string } | null;
}

export default function InvoicesList() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create invoice.");
      router.push(`/admin/invoices/${data.invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice.");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">
            Operations
          </span>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Invoices
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-ink/60 hover:border-ink"
          >
            ← Bookings
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-amber hover:border-amber disabled:opacity-60"
          >
            {creating ? "Creating…" : "+ New invoice"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-6 border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink">{error}</p>
      )}

      {!invoices ? (
        <p className="mt-10 text-sm text-ink/50">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <p className="mt-10 text-sm text-ink/50">
          No invoices yet. Create one from a booking, or start blank above.
        </p>
      ) : (
        <div className="mt-8 border border-line">
          {invoices.map((inv) => {
            const total = (inv.line_items ?? []).reduce((s, li) => s + (Number(li.amount) || 0), 0);
            return (
              <button
                key={inv.id}
                onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                className="block w-full border-b border-line bg-white px-5 py-4 text-left last:border-b-0 hover:bg-paper"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs">{inv.invoice_number || "Draft invoice"}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink/40">
                    {inv.invoice_date ?? "—"}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-ink/80">
                  {(inv.bill_to ?? "").split("\n")[0] || "No bill-to set"}
                  {inv.bookings?.tracking_number ? ` · ${inv.bookings.tracking_number}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  Total ${total.toFixed(2)} · Paid ${Number(inv.paid ?? 0).toFixed(2)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
