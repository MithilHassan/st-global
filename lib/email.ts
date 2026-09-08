import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getSetting } from "./settings";

let cachedTransporter: Transporter | null = null;

/**
 * Resolves the bcc address for outgoing emails: a Settings-page override
 * takes precedence over ADMIN_NOTIFICATION_EMAIL. An override explicitly
 * set to "" means bcc was turned off from the Settings page even if the
 * env var is still set — distinct from no override existing at all.
 */
async function resolveAdminBcc(): Promise<string | undefined> {
  const override = await getSetting("admin_notification_email");
  if (override === null) return process.env.ADMIN_NOTIFICATION_EMAIL || undefined;
  return override || undefined;
}

/**
 * Lazily creates the SMTP transporter (server-only). Reads standard SMTP
 * settings from the environment — works with Gmail (use an App Password),
 * Office365, or any other SMTP provider.
 */
function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD in your server environment."
    );
  }
  if (host.includes("@")) {
    throw new Error(
      `SMTP_HOST looks like an email address ("${host}"), not a mail server hostname. ` +
        `Put the email address in SMTP_USER instead, and set SMTP_HOST to something like ` +
        `"mail.${host.split("@")[1] || "yourdomain.com"}" (check your mail provider's SMTP settings page for the exact value).`
    );
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      // 465 is implicit TLS; anything else (587, 25) uses STARTTLS.
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

export interface BookingConfirmationInput {
  trackingNumber: string;
  fullName: string;
  email: string;
  service: string;
  goodsType: string;
  origin: string;
  destination: string;
  grossWeight: string;
  packages: string;
  dimensions?: string | null;
  shippingAddress?: string | null;
  specialInstructions?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function trackingUrlFor(trackingNumber: string): string | null {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return siteUrl ? `${siteUrl}/tracking?ref=${encodeURIComponent(trackingNumber)}` : null;
}

/**
 * Shared envelope for both email types: kicker label, heading, tracking
 * number, an optional details table, a body paragraph, and a footer with
 * the tracking link (if configured).
 */
function renderEmail(opts: {
  kicker: string;
  heading: string;
  trackingNumber: string;
  rows?: [string, string][];
  bodyHtml: string;
  bodyText: string;
}): { html: string; text: string } {
  const trackingUrl = trackingUrlFor(opts.trackingNumber);
  const htmlRows = (opts.rows || [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#666;font-size:13px;white-space:nowrap;">${escapeHtml(
          label
        )}</td><td style="padding:6px 12px;font-size:13px;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;">
      <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#1e3a8a;">${escapeHtml(
        opts.kicker
      )}</p>
      <h1 style="font-size:20px;margin:8px 0 4px;">${opts.heading}</h1>
      <p style="font-size:14px;color:#333;">Tracking number:</p>
      <p style="font-size:22px;font-weight:600;letter-spacing:0.05em;color:#1e3a8a;margin:4px 0 20px;">${escapeHtml(
        opts.trackingNumber
      )}</p>
      ${opts.bodyHtml}
      ${htmlRows ? `<table style="border-collapse:collapse;width:100%;border:1px solid #e5e5e5;margin-top:16px;">${htmlRows}</table>` : ""}
      <p style="font-size:13px;color:#555;margin-top:20px;">
        ${
          trackingUrl
            ? `Follow your shipment's status at <a href="${trackingUrl}">${trackingUrl}</a>.`
            : `Save this tracking number to follow your shipment's status.`
        }
      </p>
    </div>
  `;

  const text = [
    `${opts.kicker} — ${opts.trackingNumber}`,
    ``,
    opts.bodyText,
    ``,
    ...(opts.rows || []).map(([label, value]) => `${label}: ${value}`),
    ``,
    trackingUrl ? `Track your shipment: ${trackingUrl}` : `Save this tracking number to follow your shipment's status.`,
  ].join("\n");

  return { html, text };
}

/**
 * Sends the "booking confirmed" email to the customer, and (if configured)
 * a bcc copy to the ops team. Throws on failure — callers should catch this
 * so an email hiccup never blocks the booking itself from succeeding.
 */
export async function sendBookingConfirmationEmail(
  booking: BookingConfirmationInput
): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;

  const rows: [string, string][] = [
    ["Service", booking.service],
    ["Type of goods", booking.goodsType],
    ["Origin", booking.origin],
    ["Destination", booking.destination],
    ["Gross weight", `${booking.grossWeight} kg`],
    ["Number of packages", booking.packages],
  ];
  if (booking.dimensions) rows.push(["Dimensions", booking.dimensions]);
  if (booking.shippingAddress) rows.push(["Shipping address", booking.shippingAddress]);
  if (booking.specialInstructions)
    rows.push(["Special instructions", booking.specialInstructions]);

  const { html, text } = renderEmail({
    kicker: "Booking confirmed",
    heading: `Thanks, ${escapeHtml(booking.fullName)} — your booking is in.`,
    trackingNumber: booking.trackingNumber,
    rows,
    bodyHtml: `<p style="font-size:14px;color:#333;">Our team will confirm space, rates and documentation shortly.</p>`,
    bodyText: `Thanks, ${booking.fullName} — your booking is in. Our team will confirm space, rates and documentation shortly.`,
  });

  await transporter.sendMail({
    from,
    to: booking.email,
    bcc: await resolveAdminBcc(),
    subject: `Booking confirmed — ${booking.trackingNumber}`,
    text,
    html,
  });
}

export interface BookingStatusUpdateInput {
  trackingNumber: string;
  fullName: string;
  email: string;
  origin: string;
  destination: string;
  statusLabel: string;
  note?: string | null;
}

/**
 * Sends a "shipment status updated" email to the customer when staff move
 * a booking to a new stage from the admin panel. Throws on failure —
 * callers should catch this so an email hiccup never blocks the status
 * update itself from saving.
 */
export async function sendBookingStatusUpdateEmail(
  update: BookingStatusUpdateInput
): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;

  const rows: [string, string][] = [
    ["Route", `${update.origin} → ${update.destination}`],
    ["New status", update.statusLabel],
  ];
  if (update.note) rows.push(["Note", update.note]);

  const { html, text } = renderEmail({
    kicker: "Shipment update",
    heading: `Hi ${escapeHtml(update.fullName)} — your shipment status changed.`,
    trackingNumber: update.trackingNumber,
    rows,
    bodyHtml: `<p style="font-size:14px;color:#333;">Your shipment is now: <strong>${escapeHtml(
      update.statusLabel
    )}</strong></p>`,
    bodyText: `Your shipment is now: ${update.statusLabel}`,
  });

  await transporter.sendMail({
    from,
    to: update.email,
    bcc: await resolveAdminBcc(),
    subject: `Shipment update — ${update.statusLabel} (${update.trackingNumber})`,
    text,
    html,
  });
}
