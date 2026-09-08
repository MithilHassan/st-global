"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Boxes,
  ChevronRight,
  Ship,
  Plane,
  Package,
  User,
  Building2,
  Mail,
  Phone,
  Weight,
  Ruler,
  MapPin,
  MoreVertical,
  Copy,
  FileText,
  Trash2,
} from "lucide-react";
import { STATUS_STAGES, stageLabel, stageIndex } from "@/lib/types";
import AdminShell from "./AdminShell";
import { statusTone, StatusPill, RoutePath, relativeTime, buildArrivedNotifications } from "./shared";

interface AdminBookingEvent {
  status: string;
  note: string | null;
  occurred_at: string;
}

interface AdminBooking {
  id: string;
  tracking_number: string;
  mode: string;
  status: string;
  origin: string;
  destination: string;
  service_type: string | null;
  goods_type: string | null;
  shipper_name: string;
  shipper_company: string | null;
  shipper_email: string;
  shipper_phone: string;
  weight_kg: number | null;
  packages: number | null;
  dimensions: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  booking_events: AdminBookingEvent[];
}

const PAGE_SIZE = 8;

// Read-only progress display for the current status — all six stages
// shown at once with the reached ones filled in, plus the time the
// current stage was reached. This is separate from the actual status
// *control* below it, which is what staff use to advance the shipment.
function ProgressStepper({ status, events }: { status: string; events: AdminBookingEvent[] }) {
  const activeIndex = stageIndex(status);
  const reachedAt = (key: string) =>
    [...events].reverse().find((e) => e.status === key)?.occurred_at ?? null;
  const currentReachedAt = reachedAt(status);

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[560px] px-2 pt-1">
        <div className="absolute left-6 right-6 top-4 h-px bg-line" style={{ backgroundImage: "linear-gradient(to right, #C7CCC3 0 6px, transparent 6px 12px)", backgroundSize: "12px 1px" }} />
        <div className="relative flex justify-between">
          {STATUS_STAGES.map((s, i) => {
            const isActive = i === activeIndex;
            const isPast = i < activeIndex;
            return (
              <div key={s.key} className="flex w-[88px] flex-col items-center gap-1.5 text-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-[11px] ${
                    isActive
                      ? "bg-ink text-paper"
                      : isPast
                      ? "bg-ink/70 text-paper"
                      : "bg-white text-ink/40 ring-1 ring-inset ring-line"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`text-[10px] leading-tight ${isActive ? "font-medium text-ink" : "text-ink/40"}`}>
                  {s.label}
                </span>
                {isActive && currentReachedAt && (
                  <span className="font-mono text-[9px] leading-tight text-ink/40">
                    {new Date(currentReachedAt).toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "numeric" })}
                    <br />
                    {new Date(currentReachedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [notifyDraft, setNotifyDraft] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<"all" | "air" | "ocean">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "status">("newest");
  const [page, setPage] = useState(1);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>(STATUS_STAGES[0].key);
  const [bulkNotify, setBulkNotify] = useState(true);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load bookings.");
      setBookings(data.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Deep link from the Dashboard overview's "recent bookings" list, e.g.
  // /admin?focus=<booking-id>.
  useEffect(() => {
    const focusId = searchParams.get("focus");
    if (focusId && bookings?.some((b) => b.id === focusId)) {
      setSelectedId(focusId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  const serviceOptions = useMemo(() => {
    if (!bookings) return [];
    return Array.from(new Set(bookings.map((b) => b.service_type).filter(Boolean))) as string[];
  }, [bookings]);

  const selected = bookings?.find((b) => b.id === selectedId) ?? null;

  const filteredBookings = useMemo(() => {
    if (!bookings) return null;

    const q = searchQuery.trim().toLowerCase();
    let result = bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (modeFilter !== "all" && b.mode !== modeFilter) return false;
      if (serviceFilter !== "all" && b.service_type !== serviceFilter) return false;
      if (q) {
        const haystack = [
          b.tracking_number,
          b.shipper_name,
          b.shipper_company,
          b.shipper_email,
          b.origin,
          b.destination,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "status") return stageIndex(a.status) - stageIndex(b.status);
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortBy === "oldest" ? -diff : diff;
    });

    return result;
  }, [bookings, searchQuery, statusFilter, modeFilter, serviceFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, modeFilter, serviceFilter, sortBy]);

  const totalPages = filteredBookings ? Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE)) : 1;
  const pagedBookings = filteredBookings?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? null;

  useEffect(() => {
    if (selected) {
      setStatusDraft(selected.status);
      setNoteDraft("");
      setNotifyDraft(true);
      setStatusNotice(null);
      setMenuOpen(false);
      setHistoryExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function handleCreateInvoice() {
    if (!selected) return;
    setCreatingInvoice(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create invoice.");
      router.push(`/admin/invoices/${data.invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice.");
      setCreatingInvoice(false);
    }
  }

  async function handleUpdateStatus() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setStatusNotice(null);
    try {
      const res = await fetch(`/api/admin/bookings/${selected.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusDraft, note: noteDraft, notify: notifyDraft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status.");
      setStatusNotice(
        notifyDraft
          ? data.emailSent
            ? "Status saved and customer notified by email."
            : "Status saved, but the notification email failed to send — check server logs."
          : "Status saved. Customer was not notified."
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  function toggleBulkSelect(id: string) {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    if (!pagedBookings || pagedBookings.length === 0) return;
    const allSelected = pagedBookings.every((b) => bulkSelectedIds.has(b.id));
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      for (const b of pagedBookings) {
        if (allSelected) next.delete(b.id);
        else next.add(b.id);
      }
      return next;
    });
  }

  async function handleBulkApply() {
    if (bulkSelectedIds.size === 0) return;
    setBulkApplying(true);
    setBulkNotice(null);
    setError(null);
    const ids = Array.from(bulkSelectedIds);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/bookings/${id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: bulkStatus, notify: bulkNotify }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Failed to update status.");
          return data as { emailSent: boolean };
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled");
    const failed = results.length - succeeded.length;
    const emailsSent = succeeded.filter(
      (r) => (r as PromiseFulfilledResult<{ emailSent: boolean }>).value.emailSent
    ).length;

    setBulkNotice(
      failed === 0
        ? `Updated ${succeeded.length} booking${succeeded.length === 1 ? "" : "s"} to "${stageLabel(
            bulkStatus
          )}"${bulkNotify ? ` — ${emailsSent} customer email${emailsSent === 1 ? "" : "s"} sent.` : "."}`
        : `Updated ${succeeded.length} of ${ids.length} bookings — ${failed} failed. Check server logs.`
    );
    setBulkSelectedIds(new Set());
    setBulkApplying(false);
    await load();
  }

  function handleExportCsv() {
    if (!filteredBookings || filteredBookings.length === 0) return;
    const headers = [
      "Tracking number", "Status", "Mode", "Service", "Goods type", "Origin", "Destination",
      "Shipper name", "Company", "Email", "Phone", "Weight (kg)", "Packages", "Dimensions", "Shipping address", "Notes", "Created at",
    ];
    const escapeCsv = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const rows = filteredBookings.map((b) => [
      b.tracking_number, stageLabel(b.status), b.mode, b.service_type ?? "", b.goods_type ?? "",
      b.origin, b.destination, b.shipper_name, b.shipper_company ?? "", b.shipper_email, b.shipper_phone,
      b.weight_kg != null ? String(b.weight_kg) : "", b.packages != null ? String(b.packages) : "",
      b.dimensions ?? "", b.shipping_address ?? "", b.notes ?? "", b.created_at,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopy(value: string, label: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopyNotice(`${label} copied.`);
      setTimeout(() => setCopyNotice(null), 2000);
    });
    setMenuOpen(false);
  }

  async function handleDeleteBooking() {
    if (!selected) return;
    const confirmed = window.confirm(
      `Delete booking ${selected.tracking_number}? This permanently removes the booking and its history.\n\nAny invoice already generated for it will be kept but unlinked. This cannot be undone.`
    );
    if (!confirmed) return;

    setMenuOpen(false);
    setDeletingBooking(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${selected.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete booking.");
      setSelectedId(null);
      setBulkSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(selected.id);
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete booking.");
    } finally {
      setDeletingBooking(false);
    }
  }

  async function handleBulkDelete() {
    if (bulkSelectedIds.size === 0) return;
    const ids = Array.from(bulkSelectedIds);
    const confirmed = window.confirm(
      `Delete ${ids.length} booking${ids.length === 1 ? "" : "s"}? This permanently removes them and their history.\n\nAny invoices already generated for them will be kept but unlinked. This cannot be undone.`
    );
    if (!confirmed) return;

    setBulkApplying(true);
    setBulkNotice(null);
    setError(null);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/admin/bookings/${id}`, { method: "DELETE" }).then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Failed to delete booking.");
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    setBulkNotice(
      failed === 0
        ? `Deleted ${succeeded} booking${succeeded === 1 ? "" : "s"}.`
        : `Deleted ${succeeded} of ${ids.length} bookings — ${failed} failed. Check server logs.`
    );
    if (selectedId && ids.includes(selectedId)) setSelectedId(null);
    setBulkSelectedIds(new Set());
    setBulkApplying(false);
    await load();
  }

  const allOnPageSelected =
    !!pagedBookings && pagedBookings.length > 0 && pagedBookings.every((b) => bulkSelectedIds.has(b.id));

  const arrivedNotifications = useMemo(
    () => buildArrivedNotifications(bookings ?? []),
    [bookings]
  );

  const sortedEvents = selected
    ? [...selected.booking_events].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      )
    : [];
  const visibleEvents = historyExpanded ? sortedEvents : sortedEvents.slice(0, 3);

  return (
    <AdminShell
      active="bookings"
      eyebrow="Operations"
      title="Bookings dashboard"
      search={{ value: searchQuery, onChange: setSearchQuery, placeholder: "Search booking, tracking #, name…" }}
      notifications={arrivedNotifications}
    >
      {error && (
        <p className="mb-6 border border-signal/40 bg-signal/5 px-4 py-3 text-sm text-ink">{error}</p>
      )}
      {copyNotice && (
        <p className="mb-6 border border-teal/40 bg-teal/5 px-4 py-3 text-sm text-ink">{copyNotice}</p>
      )}

      {!bookings ? (
        <p className="mt-10 text-sm text-ink/50">Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <p className="mt-10 text-sm text-ink/50">No bookings yet.</p>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <div>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border border-line bg-white p-4">
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracking #, name, company, route…"
                  className="min-w-[220px] flex-1 border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/30 focus:border-royal"
                />
                <button
                  onClick={handleExportCsv}
                  disabled={!filteredBookings || filteredBookings.length === 0}
                  className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink/70 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Export CSV
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 border border-line bg-white px-2 py-1.5 text-xs focus:border-royal">
                  <option value="all">All statuses</option>
                  {STATUS_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="border border-line bg-white px-2 py-1.5 text-xs focus:border-royal">
                  <option value="all">All services</option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as "all" | "air" | "ocean")} className="border border-line bg-white px-2 py-1.5 text-xs focus:border-royal">
                  <option value="all">All modes</option>
                  <option value="air">Air</option>
                  <option value="ocean">Ocean</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "status")} className="border border-line bg-white px-2 py-1.5 text-xs focus:border-royal">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="status">By status</option>
                </select>
              </div>
            </div>

            {/* Select-all / count bar */}
            <div className="mt-3 flex items-center justify-between gap-3 border border-line bg-white px-4 py-2.5">
              <label className="flex items-center gap-2 text-xs text-ink/60">
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAllOnPage} className="h-4 w-4 border-line accent-royal" />
                Select all ({pagedBookings?.length ?? 0} on page)
              </label>
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink/40">
                {bulkSelectedIds.size > 0 ? `${bulkSelectedIds.size} selected · ` : ""}
                {filteredBookings?.length ?? 0} of {bookings.length}
              </span>
            </div>

            {bulkSelectedIds.size > 0 && (
              <div className="mt-3 border border-ink bg-white p-4">
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
                  Bulk update {bulkSelectedIds.size} booking{bulkSelectedIds.size === 1 ? "" : "s"}
                </p>
                <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="mt-2 w-full border border-line bg-white px-3 py-2 text-sm focus:border-royal">
                  {STATUS_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <label className="mt-3 flex items-center gap-2 text-xs text-ink/60">
                  <input type="checkbox" checked={bulkNotify} onChange={(e) => setBulkNotify(e.target.checked)} className="h-4 w-4 border-line accent-royal" />
                  Notify customers by email
                </label>
                <div className="mt-3 flex gap-2">
                  <button onClick={handleBulkApply} disabled={bulkApplying} className="flex-1 border border-ink bg-ink py-2 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60">
                    {bulkApplying ? "Applying…" : "Apply to selected"}
                  </button>
                  <button onClick={() => setBulkSelectedIds(new Set())} disabled={bulkApplying} className="border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink/60 transition-colors hover:border-ink disabled:opacity-60">
                    Clear
                  </button>
                </div>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkApplying}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 border border-signal/40 py-2 font-mono text-[11px] uppercase tracking-wider text-signal transition-colors hover:bg-signal/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={13} />
                  Delete selected
                </button>
                {bulkNotice && <p className="mt-3 text-xs text-ink/60">{bulkNotice}</p>}
              </div>
            )}

            {/* List */}
            <div className="mt-3 border border-line">
              {pagedBookings && pagedBookings.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink/50">No bookings match your search or filters.</p>
              ) : (
                pagedBookings?.map((b) => {
                  const isSelected = selectedId === b.id;
                  return (
                    <div
                      key={b.id}
                      className={`flex items-start gap-3 border-b border-line px-4 py-3.5 last:border-b-0 transition-colors ${
                        isSelected ? "bg-paperdim" : "bg-white hover:bg-paperdim/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelectedIds.has(b.id)}
                        onChange={() => toggleBulkSelect(b.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 shrink-0 border-line accent-royal"
                      />
                      <button onClick={() => setSelectedId(b.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] font-medium tracking-wide">{b.tracking_number}</span>
                            <span className="shrink-0 font-mono text-[10px] text-ink/35">{relativeTime(b.created_at)}</span>
                          </div>
                          <div className="mt-1.5">
                            <RoutePath origin={b.origin} destination={b.destination} />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-xs text-ink/50">
                              {b.shipper_name}
                              {b.shipper_company ? ` · ${b.shipper_company}` : ""}
                            </span>
                            <StatusPill status={b.status} />
                          </div>
                        </div>
                        <ChevronRight size={16} className="shrink-0 text-ink/25" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredBookings && filteredBookings.length > PAGE_SIZE && (
              <div className="mt-3 flex items-center justify-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border border-line px-2.5 py-1.5 text-xs text-ink/60 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | "ellipsis")[]>((acc, n, i, arr) => {
                    if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === "ellipsis" ? (
                      <span key={`e${i}`} className="px-1.5 text-xs text-ink/30">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`min-w-[30px] border px-2 py-1.5 font-mono text-xs ${
                          n === page ? "border-ink bg-ink text-paper" : "border-line text-ink/60 hover:border-ink"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border border-line px-2.5 py-1.5 text-xs text-ink/60 hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="grid content-start gap-6 xl:sticky xl:top-24 xl:self-start">
            <div className="border border-line bg-white p-6">
              {!selected ? (
                <p className="text-sm text-ink/50">Select a booking to view details.</p>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-line pb-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{selected.tracking_number}</span>
                        <span className="bg-royal/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-royal">
                          {selected.mode === "air" ? "Air" : "Ocean"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <RoutePath origin={selected.origin} destination={selected.destination} />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={handleCreateInvoice}
                        disabled={creatingInvoice}
                        className="flex items-center gap-1.5 border border-teal px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-teal transition-colors hover:bg-teal hover:text-paper disabled:opacity-60"
                        title="Opens this booking's invoice, creating it on first click"
                      >
                        <FileText size={13} />
                        {creatingInvoice ? "Opening…" : "Generate invoice"}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen((v) => !v)}
                          className="flex h-8 w-8 items-center justify-center border border-line text-ink/50 hover:border-ink hover:text-ink"
                        >
                          <MoreVertical size={15} />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-52 border border-line bg-white shadow-sm">
                            <button
                              onClick={() => handleCopy(selected.tracking_number, "Tracking number")}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-ink/70 hover:bg-paperdim"
                            >
                              <Copy size={13} /> Copy tracking number
                            </button>
                            <button
                              onClick={() => handleCopy(selected.shipper_email, "Customer email")}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs text-ink/70 hover:bg-paperdim"
                            >
                              <Copy size={13} /> Copy customer email
                            </button>
                            <button
                              onClick={handleDeleteBooking}
                              disabled={deletingBooking}
                              className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-xs text-signal hover:bg-signal/5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={13} /> {deletingBooking ? "Deleting…" : "Delete booking"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 font-mono text-[11px] uppercase tracking-wide text-ink/50">Shipment overview</p>
                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-4 border-b border-line pb-6 sm:grid-cols-2">
                    <IconDetail icon={selected.mode === "air" ? Plane : Ship} label="Service" value={selected.service_type ?? "—"} />
                    <IconDetail icon={Package} label="Goods type" value={selected.goods_type ?? "—"} />
                    <IconDetail icon={User} label="Shipper" value={selected.shipper_name} />
                    <IconDetail icon={Building2} label="Company" value={selected.shipper_company ?? "—"} />
                    <IconDetail icon={Mail} label="Email" value={selected.shipper_email} />
                    <IconDetail icon={Phone} label="Phone" value={selected.shipper_phone} />
                    <IconDetail icon={Weight} label="Weight" value={selected.weight_kg ? `${selected.weight_kg} kg` : "—"} />
                    <IconDetail icon={Boxes} label="Packages" value={selected.packages ? String(selected.packages) : "—"} />
                    <IconDetail icon={Ruler} label="Dimensions" value={selected.dimensions ?? "—"} />
                    <IconDetail icon={MapPin} label="Shipping address" value={selected.shipping_address ?? "—"} />
                  </dl>

                  {selected.notes && (
                    <p className="mt-4 border border-line bg-paper px-3 py-2 text-xs text-ink/70">{selected.notes}</p>
                  )}

                  <div className="mt-6 border-t border-line pt-6">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">Progress</p>
                    <div className="mt-4">
                      <ProgressStepper status={selected.status} events={selected.booking_events} />
                    </div>
                  </div>

                  <div className="mt-6 border-t border-line pt-6">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">Update status</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <select
                        value={statusDraft}
                        onChange={(e) => setStatusDraft(e.target.value)}
                        className="border border-line bg-white px-3 py-2.5 text-sm focus:border-royal sm:w-56"
                      >
                        {STATUS_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Note for this update (optional)"
                        rows={2}
                        className="flex-1 border border-line bg-white px-3 py-2.5 text-sm placeholder:text-ink/30 focus:border-royal"
                      />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-xs text-ink/60">
                      <input type="checkbox" checked={notifyDraft} onChange={(e) => setNotifyDraft(e.target.checked)} className="h-4 w-4 border-line accent-royal" />
                      Notify customer by email
                    </label>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={saving}
                      className="mt-3 w-full border border-ink bg-ink py-2.5 font-mono text-[12px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save status update"}
                    </button>
                    {statusNotice && <p className="mt-3 text-xs text-ink/60">{statusNotice}</p>}
                  </div>
                </div>
              )}
            </div>

            {selected && (
              <div className="border border-line bg-white p-6">
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">History</p>
                <ul className="relative mt-4 space-y-4 border-l border-dashed border-line pl-5">
                  {visibleEvents.map((e, i) => (
                    <li key={i} className="relative text-xs text-ink/60">
                      <span className={`absolute -left-[23px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${statusTone(e.status).dot}`} />
                      <p className="font-medium text-ink">{stageLabel(e.status)}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-ink/40">{new Date(e.occurred_at).toLocaleString()}</p>
                      {e.note && <p className="mt-1">{e.note}</p>}
                    </li>
                  ))}
                </ul>
                {sortedEvents.length > 3 && (
                  <button
                    onClick={() => setHistoryExpanded((v) => !v)}
                    className="mt-4 w-full border border-line py-2 font-mono text-[11px] uppercase tracking-wider text-ink/60 hover:border-ink hover:text-ink"
                  >
                    {historyExpanded ? "Show less" : "View full history"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function IconDetail({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-paper text-ink/50">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <dt className="font-mono text-[10px] uppercase tracking-wide text-ink/40">{label}</dt>
        <dd className="mt-0.5 truncate text-sm text-ink/80" title={value}>{value}</dd>
      </div>
    </div>
  );
}
