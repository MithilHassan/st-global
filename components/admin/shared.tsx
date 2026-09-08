import {
  Inbox,
  PackageCheck,
  ShieldCheck,
  Truck,
  MapPinned,
  CheckCircle2,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { stageLabel } from "@/lib/types";

export const STATUS_TONES: Record<
  string,
  { bg: string; text: string; dot: string; bar: string; icon: typeof Inbox }
> = {
  booking_received: { bg: "bg-royalLight/20", text: "text-royal", dot: "bg-royalLight", bar: "bg-royalLight", icon: Inbox },
  cargo_received: { bg: "bg-teal/10", text: "text-teal", dot: "bg-teal", bar: "bg-teal", icon: PackageCheck },
  customs_clearance: { bg: "bg-royal/10", text: "text-royal", dot: "bg-royal", bar: "bg-royal", icon: ShieldCheck },
  in_transit: { bg: "bg-honey/10", text: "text-honey", dot: "bg-honey", bar: "bg-honey", icon: Truck },
  arrived: { bg: "bg-marine/10", text: "text-marine", dot: "bg-marine", bar: "bg-marine", icon: MapPinned },
  delivered: { bg: "bg-success/10", text: "text-success", dot: "bg-success", bar: "bg-success", icon: CheckCircle2 },
};

export function statusTone(status: string) {
  return (
    STATUS_TONES[status] ?? {
      bg: "bg-line/40",
      text: "text-ink/60",
      dot: "bg-line",
      bar: "bg-line",
      icon: Boxes,
    }
  );
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

/**
 * Shipments that have arrived but aren't marked delivered yet — these are
 * the ones staff need to actively follow up on, so they drive the bell.
 */
export function buildArrivedNotifications(
  bookings: {
    id: string;
    tracking_number: string;
    shipper_name: string;
    status: string;
    booking_events?: { status: string; occurred_at: string }[];
  }[]
): NotificationItem[] {
  return bookings
    .filter((b) => b.status === "arrived")
    .map((b) => {
      const arrivedEvent = [...(b.booking_events ?? [])]
        .reverse()
        .find((e) => e.status === "arrived");
      return {
        id: b.id,
        title: b.tracking_number,
        subtitle: `${b.shipper_name} · arrived ${
          arrivedEvent ? relativeTime(arrivedEvent.occurred_at) : "recently"
        }`,
        href: `/admin?focus=${b.id}`,
      };
    });
}

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium ${tone.bg} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {stageLabel(status)}
    </span>
  );
}

export function RoutePath({ origin, destination }: { origin: string; destination: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
      <span className="min-w-0 truncate">{origin}</span>
      <ArrowRight size={14} className="shrink-0 text-ink/30" />
      <span className="min-w-0 truncate">{destination}</span>
    </div>
  );
}
