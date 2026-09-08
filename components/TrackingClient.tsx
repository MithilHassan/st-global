"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { STATUS_STAGES, stageIndex, stageLabel, type TrackedShipment } from "@/lib/types";

export default function TrackingClient() {
  const searchParams = useSearchParams();
  const [refInput, setRefInput] = useState(searchParams.get("ref") ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "not_found">("idle");
  const [error, setError] = useState<string | null>(null);
  const [shipment, setShipment] = useState<TrackedShipment | null>(null);

  async function lookup(trackingNumber: string) {
    if (!trackingNumber.trim()) return;
    setStatus("loading");
    setError(null);
    setShipment(null);

    try {
      const supabase = getSupabaseClient();
      const { data, error: rpcError } = await supabase.rpc("track_shipment", {
        p_tracking_number: trackingNumber.trim(),
      });
      if (rpcError) throw rpcError;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setStatus("not_found");
        return;
      }
      setShipment(row as TrackedShipment);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong looking up that shipment. Please try again."
      );
    }
  }

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) lookup(ref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    lookup(refInput);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-teal">
        Track shipment
      </span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        Where's my cargo?
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/65">
        Enter the tracking number from your booking confirmation, e.g.{" "}
        <span className="font-mono text-ink/80">STG-2026-AB12CD</span>.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
        <input
          type="text"
          value={refInput}
          onChange={(e) => setRefInput(e.target.value)}
          placeholder="STG-2026-AB12CD"
          className="flex-1 border border-line bg-white px-4 py-3 font-mono text-sm uppercase text-ink placeholder:text-ink/30 focus:border-royal"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 border border-ink bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Looking up…" : "Track"}
        </button>
      </form>

      {status === "not_found" && (
        <p className="mt-6 border border-line bg-white/60 px-4 py-3 text-sm text-ink/70">
          No shipment found for that tracking number. Double-check it against
          your booking confirmation email.
        </p>
      )}

      {status === "error" && error && (
        <p className="mt-6 border border-royal/40 bg-royal/10 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      {shipment && (
        <div className="perforated mt-10 border border-ink/15 bg-white/70 px-6 py-8 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-ink/25 pb-5 font-mono text-[11px] uppercase tracking-widest text-ink/60">
            <span>{shipment.tracking_number}</span>
            <span>{shipment.mode === "air" ? "Air freight" : "Ocean freight"}</span>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-ink/45">Origin</p>
              <p className="font-display text-lg font-semibold">{shipment.origin}</p>
            </div>
            <div className="route-line h-[2px] flex-1" aria-hidden />
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-wide text-ink/45">Destination</p>
              <p className="font-display text-lg font-semibold">{shipment.destination}</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink/50">
              Current status
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-royal">
              {stageLabel(shipment.status)}
            </p>

            <ol className="mt-6 space-y-0">
              {STATUS_STAGES.map((stage, i) => {
                const current = stageIndex(shipment.status);
                const done = i <= current;
                const event = shipment.events.find((e) => e.status === stage.key);
                return (
                  <li key={stage.key} className="relative flex gap-4 pb-8 last:pb-0">
                    {i < STATUS_STAGES.length - 1 && (
                      <span
                        className={`absolute left-[5px] top-4 h-full w-px ${
                          done ? "bg-royal" : "bg-line"
                        }`}
                        aria-hidden
                      />
                    )}
                    <span
                      className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${
                        done ? "border-royal bg-royal" : "border-line bg-white"
                      }`}
                      aria-hidden
                    />
                    <div>
                      <p
                        className={`font-display text-sm font-semibold ${
                          done ? "text-ink" : "text-ink/40"
                        }`}
                      >
                        {stage.label}
                      </p>
                      {event && (
                        <>
                          <p className="mt-0.5 font-mono text-[11px] text-ink/50">
                            {new Date(event.occurred_at).toLocaleString()}
                          </p>
                          {event.note && (
                            <p className="mt-1 text-sm text-ink/65">{event.note}</p>
                          )}
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
