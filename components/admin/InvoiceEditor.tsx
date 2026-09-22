"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Invoice, InvoiceLineItem, ChallanItem } from "@/lib/types";
import { blankLineItem, blankChallanItem, numberToWordsCurrency, CURRENCIES } from "@/lib/types";

interface Props {
  invoiceId: string;
}

// ── Editable Field ───────────────────────────────────────────
// Click-to-edit: renders as plain text until clicked, then becomes an
// input; commits on blur or Enter. Ported from the reference design.
interface EditableFieldProps {
  value: string | number | null | undefined;
  onChange?: (value: string | number) => void;
  type?: "text" | "number" | "date";
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}

function EditableField({
  value,
  onChange,
  type = "text",
  style = {},
  className = "",
  placeholder = "",
  readOnly = false,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value === null || value === undefined ? "" : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalVal(value === null || value === undefined ? "" : String(value));
  }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (readOnly) {
    return (
      <span className={`inv-field inv-field-readonly ${className}`} style={style}>
        {type === "number" ? (parseFloat(String(value)) || 0).toFixed(2) : value || "—"}
      </span>
    );
  }

  if (!editing) {
    return (
      <span
        className={`inv-field inv-field-display ${className}`}
        style={{ cursor: "pointer", ...style }}
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {type === "number" ? (parseFloat(String(value)) || 0).toFixed(2) : value || placeholder || "—"}
      </span>
    );
  }

  const commit = () => {
    setEditing(false);
    const v: string | number = type === "number" ? parseFloat(localVal) || 0 : localVal;
    if (v !== value) onChange?.(v);
  };

  return (
    <input
      ref={inputRef}
      className={`inv-field inv-field-editing ${className}`}
      type={type === "date" ? "date" : type === "number" ? "number" : "text"}
      step={type === "number" ? "0.01" : undefined}
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
      }}
      style={style}
      placeholder={placeholder}
    />
  );
}

export default function InvoiceEditor({ invoiceId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<Invoice | null>(null);
  const [originalData, setOriginalData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── Derived calculations ──────────────────────────────────
  const lineItems = useMemo(() => data?.line_items ?? [], [data]);
  const total = useMemo(
    () => lineItems.reduce((s, li) => s + (Number(li.unit) || 0) * (Number(li.unitPrice) || 0), 0),
    [lineItems]
  );
  const balance = total - (Number(data?.paid) || 0);
  const isDirty = originalData && data ? JSON.stringify(data) !== JSON.stringify(originalData) : false;

  // Tracks whether the user has manually typed something into the
  // "in words" field themselves (see updateField below). Until they do,
  // it stays in sync with the total automatically.
  const wordsCustomizedRef = useRef(false);

  // ── Load invoice ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/invoices/${invoiceId}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load invoice.");
        if (!cancelled) {
          const invoice = {
            ...json.invoice,
            challan_items:
              json.invoice.challan_items && json.invoice.challan_items.length > 0
                ? json.invoice.challan_items
                : [blankChallanItem()],
          };
          setData(invoice);
          setOriginalData(JSON.parse(JSON.stringify(invoice)));
          const loadedTotal = (json.invoice.line_items ?? []).reduce(
            (s: number, li: InvoiceLineItem) => s + (Number(li.unit) || 0) * (Number(li.unitPrice) || 0),
            0
          );
          // Only treat the saved wording as "customized" (and stop
          // auto-syncing it) if it doesn't match what auto-fill would have
          // produced for the invoice's current total.
          wordsCustomizedRef.current =
            !!json.invoice.in_words &&
            json.invoice.in_words !== numberToWordsCurrency(loadedTotal, json.invoice.currency || "USD");
        }
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Failed to load invoice.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  // ── Unsaved changes guard ──────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Auto-generate "in words" while it hasn't been customized ──
  // Keeps the words in sync with the total (and currency) every time
  // either changes — previously it only ever synced once (while the
  // field was still empty/"Zero Dollars Only"), so editing a price after
  // that first fill left the words stuck on the old amount.
  useEffect(() => {
    if (!data) return;
    if (wordsCustomizedRef.current) return;
    const words = numberToWordsCurrency(total, data.currency || "USD");
    if (words !== data.in_words) setData((d) => (d ? { ...d, in_words: words } : d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, data?.currency]);

  // ── Challan fields that mirror the invoice ──────────────────
  // These are pure derivations of other invoice fields (no separate
  // state, no effects, no "customized" escape hatch) so any edit to the
  // invoice shows up in the challan on the very next render — always,
  // with no way for the two to drift apart.
  const challanNo = data?.hbl_no ?? "";
  const challanDate = data?.invoice_date ?? "";
  const challanAddress = data?.bill_to ?? "";

  // ── Toast auto-dismiss ─────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Field updaters ─────────────────────────────────────────
  const updateField = useCallback(<K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    setData((d) => (d ? { ...d, [field]: value } : d));
  }, []);

  const updateLineItem = (idx: number, field: keyof InvoiceLineItem, value: string | number) => {
    setData((d) => {
      if (!d) return d;
      const items = [...d.line_items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...d, line_items: items };
    });
  };

  const addLineItem = () => {
    setData((d) => (d ? { ...d, line_items: [...d.line_items, blankLineItem()] } : d));
  };

  const removeLineItem = (idx: number) => {
    setData((d) => {
      if (!d || d.line_items.length <= 1) return d;
      return { ...d, line_items: d.line_items.filter((_, i) => i !== idx) };
    });
  };

  // ── Challan items — fully manual, not derived from the invoice's
  // line items. Staff adds/removes/edits every row themselves. ──
  const updateChallanItem = (idx: number, field: keyof ChallanItem, value: string) => {
    setData((d) => {
      if (!d) return d;
      const items = [...(d.challan_items ?? [])];
      items[idx] = { ...items[idx], [field]: value };
      return { ...d, challan_items: items };
    });
  };

  const addChallanItem = () => {
    setData((d) => (d ? { ...d, challan_items: [...(d.challan_items ?? []), blankChallanItem()] } : d));
  };

  const removeChallanItem = (idx: number) => {
    setData((d) => {
      if (!d || (d.challan_items ?? []).length <= 1) return d;
      return { ...d, challan_items: d.challan_items.filter((_, i) => i !== idx) };
    });
  };

  // ── Save ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!data) return;
    if (!data.invoice_number?.trim()) {
      setToast({ type: "error", msg: "Invoice Number is required" });
      return;
    }
    if (!data.invoice_date) {
      setToast({ type: "error", msg: "Invoice Date is required" });
      return;
    }
    if (!data.bill_to?.trim()) {
      setToast({ type: "error", msg: "Bill To is required" });
      return;
    }

    setSaving(true);
    try {
      // Challan No./Date/Name/Address are pure derivations of other
      // invoice fields on screen (see challanNo etc. above) — make sure
      // what actually gets saved matches what's currently displayed,
      // rather than whatever stale copy might still be sitting in state.
      // Challan items are fully manual and already live in data.challan_items.
      const payload = {
        ...data,
        paid: Number(data.paid) || 0,
        challan_no: challanNo,
        challan_date: challanDate,
        challan_address: challanAddress,
      };
      const res = await fetch(`/api/admin/invoices/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save invoice.");
      setData(json.invoice);
      setOriginalData(JSON.parse(JSON.stringify(json.invoice)));
      setToast({
        type: "success",
        msg: json.bookingSynced
          ? "Invoice saved. Shipper/consignee/route/weight/packages also updated on the linked booking."
          : "Invoice saved successfully!",
      });
    } catch (err) {
      setToast({ type: "error", msg: "Save failed: " + (err instanceof Error ? err.message : "Unknown error") });
    } finally {
      setSaving(false);
    }
  };

  // ── Print ───────────────────────────────────────────────────
  const handlePrint = () => {
    const printArea = document.getElementById("invoice-print-area");
    if (!printArea) return;
    const printContent = printArea.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Invoice - ${data?.invoice_number ?? ""}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; }
            .invoice-document { width: 100%; max-width: 800px; margin: 0 auto; }
            .inv-table { width: 100%; border-collapse: collapse; }
            .inv-table, .inv-table th, .inv-table td { border: 1px solid black; }
            .inv-header-table td { padding: 0; }
            .inv-logo-section { display: flex; align-items: center; padding: 10px; }
            .inv-logo-icon { width: 55px; height: auto; margin-right: 15px; }
            .inv-company-info h2 { margin: 0; color: #002b80; font-size: 24px; letter-spacing: 0.5px; }
            .inv-company-info p { margin: 5px 0 0; font-size: 11px; font-weight: bold; color: #002b80; white-space: nowrap; }
            .inv-title-cell { text-align: center; font-size: 28px; font-weight: bold; border-bottom: 1px solid black; height: 40px; vertical-align: middle; }
            .inv-meta-header td { text-align: center; font-weight: bold; font-size: 14px; border-bottom: 1px solid black; padding: 3px; }
            .inv-meta-values td { height: 30px; text-align: center; font-size: 14px; }
            .inv-bill-to-label { width: 44%; vertical-align: top; border-right: 1px solid black; padding: 3px 5px; font-weight: bold; font-size: 16px; }
            .inv-bill-to-details { width: 56%; padding: 0; }
            .inv-bill-to-details table td { padding: 3px 5px; font-weight: bold; font-size: 13px; }
            .inv-bill-to-details table tr:not(:last-child) td { border-bottom: 1px solid black; }
            .inv-details-header td { padding: 3px; font-size: 12px; text-align: center; font-weight: bold; }
            .inv-details-values td { height: 25px; text-align: center; font-size: 12px; }
            .inv-main-data th { text-align: center; padding: 5px; font-size: 13px; }
            .inv-totals-table td { font-size: 13px; }
            .inv-seal-container { display: flex; justify-content: flex-end; margin-top: 20px; padding-right: 80px; }
            .inv-seal-image { width: 120px; height: auto; object-fit: contain; }
            .inv-footer { display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; font-weight: bold; }
            .inv-line-item-row td { padding: 4px 5px; vertical-align: middle; font-size: 13px; }
            .no-print { display: none !important; }
            .print-only { display: inline !important; }
            .inv-field { display: inline-block; }
            .inv-field-editing { border: none; background: transparent; outline: none; box-shadow: none; width: 100%; font-family: inherit; font-size: inherit; }
            .challan-section { page-break-before: always; margin-top: 0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="invoice-document">
            ${printContent}
          </div>
          <script>
            const inputs = document.querySelectorAll('input');
            inputs.forEach(function (input) { input.setAttribute('value', input.value); });
            window.onload = function () {
              setTimeout(function () { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 10000);
  };

  if (loading) {
    return (
      <div className="invoice-loading">
        <div className="invoice-loading-spinner" />
        <p>Loading invoice…</p>
        <style jsx global>{`
          .invoice-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 12px;
            color: #666;
          }
          .invoice-loading-spinner {
            width: 28px;
            height: 28px;
            border: 3px solid #ddd;
            border-top-color: #111;
            border-radius: 50%;
            animation: inv-spin 0.8s linear infinite;
          }
          @keyframes inv-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="border border-[#002b80]/40 bg-[#002b80]/10 px-4 py-3 text-sm text-ink">
          {loadError ?? "Invoice not found."}
        </p>
        <button
          onClick={() => router.push("/admin/invoices")}
          className="mt-4 border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-wider"
        >
          Back to invoices
        </button>
      </div>
    );
  }

  return (
    <div className="invoice-editor-wrapper">
      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div className={`inv-toast inv-toast-${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      {/* ── Toolbar (hidden in print) ─────────────────────── */}
      <div className="inv-toolbar no-print">
        <div className="inv-toolbar-left">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/admin/invoices")}>
            ← Back to Invoices
          </button>
          {isDirty && <span className="inv-unsaved-badge">● Unsaved changes</span>}
        </div>
        <div className="inv-toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
            🖨 Print
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? "⏳ Saving..." : "💾 Save Invoice"}
          </button>
        </div>
      </div>
      {data.booking_id && (
        <p className="no-print" style={{ margin: "-8px 0 16px", fontSize: 12, color: "#0B1E33", opacity: 0.55 }}>
          Shipper, consignee, POL/POD, weight, and packages are linked to this invoice's booking — saving here
          updates the booking's record too.
        </p>
      )}

      {/* ══════════════════════════════════════════════════════
          INVOICE DOCUMENT
          ══════════════════════════════════════════════════════ */}
      <div className="invoice-document" id="invoice-print-area">
        {/* ── HEADER: Logo + Invoice Number/Date ──────────── */}
        <table className="inv-table inv-header-table">
          <tbody>
            <tr>
              <td style={{ width: "56%", borderRight: "1px solid black", borderBottom: "1px solid black" }}>
                <div className="inv-logo-section">
                  <img src="/images/logo.png" alt="ST Logo" className="inv-logo-icon" />
                  <div className="inv-company-info">
                    <h2>ST GLOBAL FORWARDING</h2>
                    <p>
                      Ka/31, Joar Shahara, Vatara, Dhaka-1229, Bangladesh.
                      <br />
                      Mobile: +8801719 089697 &nbsp; Mail: tapos@stbd.net
                    </p>
                  </div>
                </div>
              </td>
              <td style={{ width: "44%", verticalAlign: "top", padding: 0 }}>
                <table style={{ width: "100%", height: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td colSpan={2} className="inv-title-cell">
                        Invoice
                      </td>
                    </tr>
                    <tr className="inv-meta-header">
                      <td style={{ width: "50%", borderRight: "1px solid black" }}>Number</td>
                      <td style={{ width: "50%" }}>Date</td>
                    </tr>
                    <tr className="inv-meta-values">
                      <td style={{ borderRight: "1px solid black" }}>
                        <EditableField
                          value={data.invoice_number}
                          onChange={(v) => updateField("invoice_number", String(v))}
                          placeholder="INV-000"
                        />
                      </td>
                      <td>
                        <EditableField
                          value={data.invoice_date}
                          onChange={(v) => updateField("invoice_date", String(v))}
                          type="date"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── BILL TO + SHIPPER/CONSIGNEE/POL/POD ─────────── */}
        <table className="inv-table" style={{ borderTop: "none" }}>
          <tbody>
            <tr>
              <td className="inv-bill-to-label">
                Bill To:
                <br />
                <span style={{ fontWeight: "normal", fontSize: 13, marginTop: 10 }}>
                  <EditableField
                    value={data.bill_to}
                    onChange={(v) => updateField("bill_to", String(v))}
                    placeholder="Client name / address"
                  />
                </span>
              </td>
              <td className="inv-bill-to-details">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "25%", borderRight: "1px solid black" }}>Shipper</td>
                      <td style={{ width: "75%", fontWeight: "normal" }}>
                        <EditableField
                          value={data.shipper}
                          onChange={(v) => updateField("shipper", String(v))}
                          placeholder="Shipper name"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderRight: "1px solid black" }}>Consignee</td>
                      <td style={{ fontWeight: "normal" }}>
                        <EditableField
                          value={data.consignee}
                          onChange={(v) => updateField("consignee", String(v))}
                          placeholder="Consignee name"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderRight: "1px solid black" }}>POL</td>
                      <td style={{ fontWeight: "normal" }}>
                        <EditableField
                          value={data.pol}
                          onChange={(v) => updateField("pol", String(v))}
                          placeholder="Port of Loading"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ borderRight: "1px solid black" }}>POD</td>
                      <td style={{ fontWeight: "normal" }}>
                        <EditableField
                          value={data.pod}
                          onChange={(v) => updateField("pod", String(v))}
                          placeholder="Port of Discharge"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── SHIPMENT DETAILS ROW ────────────────────────── */}
        <table className="inv-table inv-details-header" style={{ marginTop: 15 }}>
          <tbody>
            <tr>
              <td style={{ width: "7%" }}>Rep</td>
              <td style={{ width: "9%" }}>Terms</td>
              <td style={{ width: "9%" }}>Exch Rate</td>
              <td style={{ width: "15%" }}>Truck Challan / MBL / MAWB No.</td>
              <td style={{ width: "14%" }}>HBL / HAWB No.</td>
              <td style={{ width: "6%" }}>Pkgs</td>
              <td style={{ width: "11%" }}>ETD</td>
              <td style={{ width: "11%" }}>ETA</td>
              <td style={{ width: "8%" }}>Weight</td>
              <td style={{ width: "10%" }}>Volume</td>
            </tr>
            <tr className="inv-details-values">
              <td>
                <EditableField value={data.rep} onChange={(v) => updateField("rep", String(v))} />
              </td>
              <td>
                <EditableField value={data.terms} onChange={(v) => updateField("terms", String(v))} />
              </td>
              <td>
                <EditableField
                  value={data.exch_rate}
                  onChange={(v) => updateField("exch_rate", Number(v))}
                  type="number"
                />
              </td>
              <td>
                <EditableField
                  value={data.truck_callan_no}
                  onChange={(v) => updateField("truck_callan_no", String(v))}
                />
              </td>
              <td>
                <EditableField value={data.hbl_no} onChange={(v) => updateField("hbl_no", String(v))} />
              </td>
              <td>
                <EditableField value={data.pkgs} onChange={(v) => updateField("pkgs", Number(v))} type="number" />
              </td>
              <td>
                <EditableField value={data.etd} onChange={(v) => updateField("etd", String(v))} type="date" />
              </td>
              <td>
                <EditableField value={data.eta} onChange={(v) => updateField("eta", String(v))} type="date" />
              </td>
              <td>
                <EditableField
                  value={data.weight}
                  onChange={(v) => updateField("weight", Number(v))}
                  type="number"
                />
              </td>
              <td>
                <EditableField value={data.volume} onChange={(v) => updateField("volume", String(v))} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── LINE ITEMS TABLE ────────────────────────────── */}
        <div className="no-print" style={{ marginTop: 15, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, fontWeight: "bold", color: "#666" }}>Currency</label>
          <select
            value={data.currency || "USD"}
            onChange={(e) => updateField("currency", e.target.value)}
            style={{ border: "1px solid #ccc", padding: "4px 8px", fontSize: 12, maxWidth: 220 }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.majorUnit} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
        <table className="inv-table inv-main-data" style={{ marginTop: 6 }}>
          <thead>
            <tr>
              <th style={{ width: "6%" }}>S/N</th>
              <th style={{ width: "42%" }}>Description</th>
              <th style={{ width: "12%" }}>Unit</th>
              <th style={{ width: "14%" }}>Unit Price({data.currency || "USD"})</th>
              <th style={{ width: "14%" }}>Amount({data.currency || "USD"})</th>
              <th style={{ width: "12%" }} className="no-print">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li, idx) => {
              const amount = (Number(li.unit) || 0) * (Number(li.unitPrice) || 0);
              return (
                <tr key={idx} className="inv-line-item-row">
                  <td style={{ textAlign: "center" }}>{idx + 1}</td>
                  <td>
                    <EditableField
                      value={li.description}
                      onChange={(v) => updateLineItem(idx, "description", String(v))}
                      placeholder="Description"
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <EditableField
                      value={li.unit}
                      onChange={(v) => updateLineItem(idx, "unit", Number(v))}
                      type="number"
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <EditableField
                      value={li.unitPrice}
                      onChange={(v) => updateLineItem(idx, "unitPrice", Number(v))}
                      type="number"
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <EditableField value={amount} readOnly type="number" />
                  </td>
                  <td style={{ textAlign: "center" }} className="no-print">
                    {lineItems.length > 1 && (
                      <button
                        className="inv-row-btn inv-row-btn-del"
                        onClick={() => removeLineItem(idx)}
                        title="Remove row"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="no-print">
              <td colSpan={6} style={{ textAlign: "left", padding: "6px 10px" }}>
                <button className="inv-row-btn inv-row-btn-add" onClick={addLineItem}>
                  + Add Row
                </button>
              </td>
            </tr>
          </tbody>
          {/* ── TOTALS SECTION ──────────────────────────────── */}
          <tbody className="inv-totals-table" style={{ borderTop: "2px solid black" }}>
            <tr>
              <td rowSpan={3} colSpan={2} style={{ padding: 10, verticalAlign: "bottom", fontSize: 13 }}>
                In words:
                <br />
                <EditableField
                  value={data.in_words}
                  onChange={(v) => {
                    wordsCustomizedRef.current = true;
                    updateField("in_words", String(v));
                  }}
                  placeholder="Amount in words"
                  style={{ fontWeight: "bold", fontSize: 12, display: "block", marginTop: 6 }}
                />
              </td>
              <td style={{ padding: 5, textAlign: "center", fontSize: 11 }}>For Customer</td>
              <td style={{ padding: 5, textAlign: "right", fontWeight: "bold" }}>Total ({data.currency || "USD"})</td>
              <td style={{ padding: 5, textAlign: "right", fontWeight: "bold" }}>{total.toFixed(2)}</td>
              <td className="no-print"></td>
            </tr>
            <tr>
              <td rowSpan={2} style={{ padding: 5, textAlign: "center", verticalAlign: "middle", fontSize: 11 }}>
                Thanks for the business
              </td>
              <td style={{ padding: 5, textAlign: "right", fontWeight: "bold" }}>Paid ({data.currency || "USD"})</td>
              <td style={{ padding: 5, textAlign: "right", fontWeight: "bold" }}>
                <EditableField value={data.paid} onChange={(v) => updateField("paid", Number(v))} type="number" />
              </td>
              <td className="no-print"></td>
            </tr>
            <tr>
              <td style={{ padding: 5, textAlign: "right", fontWeight: "bold" }}>
                <select
                  className="no-print"
                  value={data.balance_type || "due"}
                  onChange={(e) => updateField("balance_type", e.target.value)}
                  style={{
                    border: "1px solid #ccc",
                    padding: "3px 6px",
                    fontSize: 13,
                    fontWeight: "bold",
                    fontFamily: "inherit",
                    background: "white",
                  }}
                >
                  <option value="due">Due</option>
                  <option value="discount">Discount</option>
                </select>
                {/* Selects don't survive the print clone (their selected
                    option is only tracked as a live DOM property, not
                    reflected in innerHTML) — this plain-text span is
                    what actually shows up on the printed page. */}
                <span className="print-only">{data.balance_type === "discount" ? "Discount" : "Due"}</span>
                {" "}({data.currency || "USD"})
              </td>
              <td style={{ padding: 5, textAlign: "right", fontWeight: "bold" }}>{balance.toFixed(2)}</td>
              <td className="no-print"></td>
            </tr>
          </tbody>
        </table>

        {/* ── SEAL + SIGNATURE ────────────────────────────── */}
        <div className="inv-seal-container">
          <img src="/images/seal.png" alt="Company Seal" className="inv-seal-image" />
        </div>

        {/* ── FOOTER ──────────────────────────────────────── */}
        <div className="inv-footer">
          <table className="inv-table" style={{ width: "44%", textAlign: "center" }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", padding: 4 }}>Phone</td>
                <td style={{ width: "50%", padding: 4 }}>Email</td>
              </tr>
              <tr>
                <td style={{ padding: 4, fontWeight: "normal" }}>
                  <EditableField
                    value={data.company_phone}
                    onChange={(v) => updateField("company_phone", String(v))}
                  />
                </td>
                <td style={{ padding: 4, fontWeight: "normal" }}>
                  <EditableField
                    value={data.company_email}
                    onChange={(v) => updateField("company_email", String(v))}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <table
            className="inv-table"
            style={{ width: "40%", textAlign: "center", height: "fit-content", alignSelf: "flex-end" }}
          >
            <tbody>
              <tr>
                <td style={{ padding: 6 }}>ST Global Forwarding</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ══════════════════════════════════════════════════════
            CHALLAN — prints on its own page, right after the invoice
            ══════════════════════════════════════════════════════ */}
        <div className="challan-section">
          <p className="no-print" style={{ margin: "0 0 8px", fontSize: 11, color: "#666" }}>
            ↓ Challan — prints on a separate page after the invoice above
          </p>

          <table className="inv-table inv-header-table">
            <tbody>
              <tr>
                <td style={{ width: "56%", borderRight: "1px solid black", borderBottom: "1px solid black" }}>
                  <div className="inv-logo-section">
                    <img src="/images/logo.png" alt="ST Logo" className="inv-logo-icon" />
                    <div className="inv-company-info">
                      <h2>ST GLOBAL FORWARDING</h2>
                      <p>
                        Ka/31, Joar Shahara, Vatara, Dhaka-1229, Bangladesh.
                        <br />
                        Mobile: +8801719 089697 &nbsp; Mail: tapos@stbd.net
                      </p>
                    </div>
                  </div>
                </td>
                <td style={{ width: "44%", verticalAlign: "top", padding: 0 }}>
                  <table style={{ width: "100%", height: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td colSpan={2} className="inv-title-cell">
                          Challan
                        </td>
                      </tr>
                      <tr className="inv-meta-header">
                        <td style={{ width: "50%", borderRight: "1px solid black" }}>Challan No.</td>
                        <td style={{ width: "50%" }}>Date</td>
                      </tr>
                      <tr className="inv-meta-values">
                        <td style={{ borderRight: "1px solid black" }}>
                          <EditableField value={challanNo} readOnly />
                        </td>
                        <td>
                          <EditableField value={challanDate} type="date" readOnly />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <p className="no-print" style={{ margin: "6px 0 0", fontSize: 10, color: "#888" }}>
            Challan No., Date and Bill To always match the invoice's HBL No., Invoice Date and Bill To above — edit
            those fields to update the challan. Items below are entered and maintained manually.
          </p>

          <table className="inv-table" style={{ marginTop: -1 }}>
            <tbody>
              <tr>
                <td style={{ padding: 0 }}>
                  {/* A real <textarea> here would silently print blank —
                      this app's Print button clones innerHTML, and a
                      textarea's live value isn't reflected there. A
                      styled div gets the same look with none of that risk. */}
                  <div
                    style={{
                      width: "100%",
                      minHeight: 112,
                      padding: "6px 8px",
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      boxSizing: "border-box",
                    }}
                  >
                    <p style={{ padding: "3px 5px", fontWeight: "bold" }}>Bill To:</p>
                    {challanAddress || "—"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="inv-table inv-main-data" style={{ marginTop: -1 }}>
            <thead>
              <tr>
                <th style={{ width: "8%" }}>SL No.</th>
                <th style={{ width: "42%" }}>Description</th>
                <th style={{ width: "13%" }}>Qty</th>
                <th style={{ width: "13%" }}>Weight</th>
                <th style={{ width: "16%" }}>Remark</th>
                <th className="no-print" style={{ width: "8%" }}></th>
              </tr>
            </thead>
            <tbody>
              {(data.challan_items ?? []).map((item, idx) => (
                <tr key={idx} className="inv-line-item-row">
                  <td style={{ textAlign: "center" }}>{idx + 1}</td>
                  <td>
                    <EditableField
                      value={item.description}
                      onChange={(v) => updateChallanItem(idx, "description", String(v))}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <EditableField
                      value={item.qty}
                      onChange={(v) => updateChallanItem(idx, "qty", String(v))}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <EditableField
                      value={item.weight}
                      onChange={(v) => updateChallanItem(idx, "weight", String(v))}
                    />
                  </td>
                  <td>
                    <EditableField
                      value={item.remark}
                      onChange={(v) => updateChallanItem(idx, "remark", String(v))}
                    />
                  </td>
                  <td className="no-print" style={{ textAlign: "center" }}>
                    <button
                      className="inv-row-btn inv-row-btn-del"
                      onClick={() => removeChallanItem(idx)}
                      disabled={(data.challan_items ?? []).length <= 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="inv-row-btn inv-row-btn-add no-print" style={{ marginTop: 6 }} onClick={addChallanItem}>
            + Add row
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 60 }}>
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: "bold" }}>
              <div style={{ width: 180, borderTop: "1px solid black", paddingTop: 4 }}>Authorized Signature</div>
            </div>
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: "bold" }}>
              <div style={{ width: 180, borderTop: "1px solid black", paddingTop: 4 }}>Customer Signature</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .invoice-editor-wrapper {
          min-height: 100vh;
          background: #f4f5f7;
        }
        .inv-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
          background: #fff;
          border-bottom: 1px solid #e2e2e2;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .inv-toolbar-left,
        .inv-toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .inv-unsaved-badge {
          font-size: 12px;
          color: #002b80;
          font-weight: 600;
        }
        .btn {
          border: 1px solid #002b80;
          background: #fff;
          color: #002b80;
          padding: 8px 16px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-primary {
          background: #002b80;
          color: #fff;
          border-color: #002b80;
        }
        .btn-primary:hover:not(:disabled) {
          background: #001a52;
          border-color: #001a52;
        }
        .btn-secondary:hover {
          border-color: #001a52;
          color: #001a52;
          background: #eef2ff;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .inv-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 13px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }
        .inv-toast-success {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #6ee7b7;
        }
        .inv-toast-error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
        .inv-toast button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          color: inherit;
        }

        .invoice-document {
          width: 100%;
          max-width: 900px;
          margin: 24px auto;
          padding: 24px;
          background: #fff;
          color: #000;
          font-family: Arial, sans-serif;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
        }
        .inv-table {
          width: 100%;
          border-collapse: collapse;
        }
        .inv-table,
        .inv-table th,
        .inv-table td {
          border: 1px solid black;
        }
        .inv-header-table td {
          padding: 0;
        }
        .inv-logo-section {
          display: flex;
          align-items: center;
          padding: 10px;
        }
        .inv-logo-icon {
          width: 55px;
          height: auto;
          margin-right: 15px;
        }
        .inv-company-info h2 {
          margin: 0;
          color: #002b80;
          font-size: 24px;
          letter-spacing: 0.5px;
        }
        .inv-company-info p {
          margin: 5px 0 0;
          font-size: 11px;
          font-weight: bold;
          color: #002b80;
          white-space: nowrap;
        }
        .inv-title-cell {
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          border-bottom: 1px solid black;
          height: 40px;
          vertical-align: middle;
        }
        .inv-meta-header td {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          border-bottom: 1px solid black;
          padding: 3px;
        }
        .inv-meta-values td {
          height: 30px;
          text-align: center;
          font-size: 14px;
        }
        .inv-bill-to-label {
          width: 44%;
          vertical-align: top;
          border-right: 1px solid black;
          padding: 3px 5px;
          font-weight: bold;
          font-size: 16px;
        }
        .inv-bill-to-details {
          width: 56%;
          padding: 0;
        }
        .inv-bill-to-details table td {
          padding: 3px 5px;
          font-weight: bold;
          font-size: 13px;
        }
        .inv-bill-to-details table tr:not(:last-child) td {
          border-bottom: 1px solid black;
        }
        .inv-details-header td {
          padding: 3px;
          font-size: 12px;
          text-align: center;
          font-weight: bold;
        }
        .inv-details-values td {
          height: 25px;
          text-align: center;
          font-size: 12px;
        }
        .inv-main-data th {
          text-align: center;
          padding: 5px;
          font-size: 13px;
        }
        .inv-totals-table td {
          font-size: 13px;
        }
        .inv-seal-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          padding-right: 80px;
        }
        .inv-seal-image {
          width: 120px;
          height: auto;
          object-fit: contain;
        }
        .inv-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 12px;
          font-weight: bold;
        }
        .inv-line-item-row td {
          padding: 4px 5px;
          vertical-align: middle;
          font-size: 13px;
        }

        .inv-field {
          display: inline-block;
        }
        .inv-field-display:hover {
          background: rgba(0, 43, 128, 0.08);
        }
        .inv-field-editing {
          border: none;
          background: rgba(0, 43, 128, 0.08);
          outline: none;
          box-shadow: none;
          width: 100%;
          font-family: inherit;
          font-size: inherit;
        }

        .inv-row-btn {
          border: 1px solid #ccc;
          background: #fff;
          cursor: pointer;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 3px;
        }
        .inv-row-btn-del {
          color: #b91c1c;
          border-color: #fca5a5;
        }
        .inv-row-btn-del:hover {
          background: #fef2f2;
        }
        .inv-row-btn-add {
          color: #0f766e;
          border-color: #5eead4;
        }
        .inv-row-btn-add:hover {
          background: #f0fdfa;
        }
        .challan-section {
          margin-top: 48px;
          border-top: 2px dashed #ccc;
          padding-top: 32px;
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}
