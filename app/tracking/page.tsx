import { Suspense } from "react";
import Nav from "@/components/Nav";
import TrackingClient from "@/components/TrackingClient";

export default function TrackingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Nav />
      <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-16 text-sm text-ink/50">Loading…</div>}>
        <TrackingClient />
      </Suspense>
    </main>
  );
}
