# ST Global Forwarding — Website

Next.js 14 (App Router) + Tailwind CSS site built from the company profile document.

## Supabase setup (booking + tracking)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase/schema.sql` — it creates the `bookings`
   and `booking_events` tables and two functions (`create_booking`,
   `track_shipment`) that the site calls through.
   - Already ran an earlier version of `schema.sql`? Run
     `supabase/migrations/002_booking_wizard.sql` instead — it adds the
     `goods_type`, `packages` and `dimensions` columns the 4-step booking
     wizard needs, and replaces `create_booking` with the matching
     signature. Safe to re-run.
   - Also run `supabase/migrations/003_invoices.sql` (adds the `invoices`
     table), `supabase/migrations/004_settings.sql` (adds the
     `app_settings` table for a UI-changeable shared password and ops
     notification email), `supabase/migrations/005_admin_users.sql`
     (named admin logins), `supabase/migrations/006_super_admin.sql`
     (restricts who can manage admin accounts), and
     `supabase/migrations/007_site_content.sql` (adds the `site_content`
     table behind the homepage CMS — see "Content (CMS)" below), and
     `supabase/migrations/008_challan.sql` (adds delivery-challan fields
     to each invoice — see "Challan" below). All are additive and safe to
     re-run.
3. Copy `.env.local.example` to `.env.local` and fill in your project's
   URL, anon key, service role key, and an admin password + session
   secret (Project Settings → API for the first three).
4. Fill in the `SMTP_*` values in `.env.local` so booking confirmation
   emails can send (see "Booking confirmation emails" below).

**Why functions instead of direct table access:** RLS is enabled on both
tables with no public policies, so the anon key (which ships in the
browser bundle) can't read or write the tables directly. The booking form
calls `create_booking(...)`, which validates input and inserts atomically.
The tracking page calls `track_shipment(tracking_number)`, which returns
only shipment status/route/events — not the shipper's email or phone — so
knowing a tracking number lets someone check status without exposing
anyone's contact details.

**Updating shipment status:** staff sign in at `/admin` (password from
`ADMIN_PASSWORD`) to see all bookings and push status updates — no need to
touch the Supabase dashboard directly. Each update writes a row to
`booking_events`, which is what shows up on the public tracking timeline.
`/admin` isn't linked from the site nav; bookmark it directly.

The admin panel's API routes (`app/api/admin/*`) use the Supabase
**service role key**, which bypasses Row Level Security entirely — that
key stays server-side only and is gated behind a signed, httpOnly session
cookie set at login. It's a different trust boundary from the public
`create_booking` / `track_shipment` functions the customer-facing pages
use, which stay scoped to what a customer should be able to do.

## Admin accounts

There are two ways into `/admin`:

- **Shared team password** — `ADMIN_PASSWORD` in the environment, or a
  custom one set from Settings → Account & Security. Sign in leaving the
  Email field blank.
- **Named admin accounts** — created from Settings → Admin users (name,
  email, password), visible only to super admins. Each person signs in
  with their own email + password, and the sidebar shows their name
  instead of a generic label.

**Super admins only** can create or remove admin accounts. The shared
password is always treated as super admin; named admins are regular
staff by default unless "Make this a super admin" is checked when
they're created — that's what actually gates who sees the Admin users
section and can call its API routes, not just a hidden UI button.

Named accounts are additive, not a replacement: the shared password
keeps working even after named admins exist, so nobody gets locked out —
even if every super-admin-flagged named account were ever deleted, the
shared password login still has full admin-management rights.
Passwords (both kinds) are hashed with Node's built-in `scrypt` — no
extra dependency, no native bindings, never stored in plain text.

## Content (CMS)

Settings → **Content** in `/admin` lets staff edit the homepage's actual
business content without touching code:

- **Hero** — headline, subheadline, button labels, and a background photo
  upload (replaces the default illustration; JPG/PNG/WEBP/GIF, up to 8MB)
- **Stats bar** — the four highlight numbers
- **Office network** — section heading + add/remove/edit office cards
- **Company profile** — section heading/intro + the 12 registration/
  license rows (labels, values, badges — icons stay fixed by position)
- **Key contacts** — section heading + add/remove/edit staff cards
- **Footer / "get a quote"** — heading, body, address, email, phone,
  copyright line
- **Social media** — the 4 icon links in the header's top bar (Twitter/X,
  Instagram, LinkedIn, Facebook); leaving one blank hides that icon

Content lives in the `site_content` table (`lib/content.ts`), one JSON
block per section. Most blocks are read directly by the homepage server
component at render time. The **social links** are the one exception —
`Nav.tsx` renders on a client-side page too (the booking wizard), so it
fetches them itself from a small public, unauthenticated endpoint
(`GET /api/content/social`) rather than via props; that data isn't
sensitive, it's the same links already visible in the page. The homepage
is statically generated for speed; saving a block calls
`revalidatePath("/")` so the change is live on the next page load instead
of waiting for a redeploy.

**Hero image uploads** use Supabase Storage (`lib/storage.ts`) — a
`site-assets` bucket is created automatically (public, 8MB file-size
limit) on first upload via the same service-role client already used
everywhere else, so no manual dashboard setup is required beyond having
`SUPABASE_SERVICE_ROLE_KEY` set. Re-uploading overwrites the same file
path rather than accumulating orphaned images.
Every block falls back to sensible defaults (matching what was
originally hardcoded) if the table is empty or unreachable, so the site
never breaks because of this.

**What's intentionally *not* in the CMS**, to keep this scoped and low-
risk: the full service manifest list, the air/ocean feature blocks (body
copy + carrier tag lists + photos), and the carrier code lists. Those
change far less often and touch images/layout more than plain text —
happy to add editing for any of them on request.

## Challan

Every invoice now has a **delivery challan** (goods receipt) attached —
based on the company's existing paper Challan template — that prints
right after the invoice. In `components/admin/InvoiceEditor.tsx`:

- Editable fields: Challan No. (prefilled from the tracking number),
  Date, Name, Address, Contact No., and a line-item table (SL No.,
  Description, Qty, Weight, Remark) with add/remove rows — all click-to-
  edit, same as the rest of the invoice.
- **Prints on its own page.** Hitting "Print" already grabs everything
  inside `#invoice-print-area` as one blob; the challan lives in that
  same area but with `page-break-before: always` in the print
  stylesheet, so it comes out as page 2 rather than being crammed under
  the invoice.
- Saved as new columns on the `invoices` table (`challan_no`,
  `challan_date`, `challan_name`, `challan_address`, `challan_contact`,
  `challan_items` as JSON) — one "Save Invoice" click saves both
  documents together, since they share the same save button and API
  call.
- Auto-filled from the booking when an invoice is first generated (name,
  contact, cargo description, packages, weight), same as the rest of the
  invoice's prefill — editable afterward like everything else.

## Booking confirmation emails

When a customer submits the booking wizard, the browser posts the form to
`app/api/bookings`, a server route that:

1. Calls `create_booking(...)` via the Supabase **service role** client
   (same trust boundary as the admin routes) to insert the booking and
   generate the tracking number.
2. Emails the customer a confirmation (tracking number + booking summary)
   over SMTP, using `lib/email.ts` / `nodemailer`.

Booking creation and email sending are decoupled: if the email fails to
send (bad credentials, provider outage, etc.) the booking is **not**
rolled back — the customer still gets their tracking number on-screen and
the failure is only logged server-side (`emailSent: false` in the API
response). Configure SMTP via the `SMTP_*` / `EMAIL_FROM` /
`ADMIN_NOTIFICATION_EMAIL` / `NEXT_PUBLIC_SITE_URL` variables in
`.env.local.example`:

- Gmail: use an [App Password](https://myaccount.google.com/apppasswords)
  (not your normal password), `smtp.gmail.com`, port `587`.
- Office365: `smtp.office365.com`, port `587`, your mailbox credentials.
- Any other provider: use whatever SMTP host/port/credentials it gives you.

Set `ADMIN_NOTIFICATION_EMAIL` if you also want a bcc copy of every
confirmation sent to your ops inbox.

**Status-update emails:** the same SMTP setup also powers a second email —
when staff push a status change from `/admin` (e.g. "In transit",
"Delivered"), the customer gets an email with the new status and any note
staff added. This uses the same `lib/email.ts` transporter, so no extra
configuration is needed. Staff can uncheck "Notify customer by email" in
the status-update form for internal-only notes that shouldn't reach the
customer. Like the booking-confirmation email, a failed send here never
blocks the status update itself from saving — it's reported back as
`emailSent: false` and logged server-side.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm run dev
```

Open http://localhost:3000

## Build for production

```bash
npm run build
npm run start
```

## Structure

- `app/page.tsx` — all page content/sections (hero, services, air/ocean feature blocks, network/offices, company profile table, key contacts, contact form)
- `app/layout.tsx` — root layout + page metadata
- `app/globals.css` — design tokens, fonts, signature visual utilities (perforated hero card, route-line, container-yard grid texture)
- `components/Nav.tsx` — sticky nav with mobile menu
- `components/RouteManifest.tsx` — Dhaka → Chittagong → Global route strip (signature element)
- `components/TrackingClient.tsx` — tracking lookup form + status timeline
- `app/booking/page.tsx` — 4-step booking wizard (Service → Details → Contact → Review), submits to `app/api/bookings`
- `app/api/bookings/route.ts` — creates the booking (service role RPC call) and sends the confirmation email
- `lib/email.ts` — SMTP/nodemailer helper that sends the booking-confirmation email
- `app/tracking/page.tsx` — tracking page shell (wraps the client tracker in Suspense)
- `app/admin/page.tsx` — staff bookings dashboard (password-gated)
- `app/api/admin/` — login/logout + booking list/status-update route handlers, used only by the admin panel
- `lib/supabase.ts` — lazy Supabase client for the public pages (anon key)
- `lib/supabaseAdmin.ts` — server-only Supabase client for admin routes (service role key, bypasses RLS)
- `lib/adminAuth.ts` — password check + signed session cookie for `/admin`
- `supabase/schema.sql` — full database schema, RLS setup, and RPC functions (fresh installs)
- `supabase/migrations/` — incremental SQL changes for installs that already ran an earlier `schema.sql`
- `lib/types.ts` — shared booking/tracking types and status-stage labels
- `public/images/` — logo and two photos extracted from the company profile document (swap these for higher-resolution originals if available)

## Design notes

- Palette: ink navy `#0B1E33`, marine `#123A57`, port teal `#1C6E71`, cargo amber `#E2812A`, paper `#F1F3ED`
- Type: Space Grotesk (display), Inter (body), JetBrains Mono (waybill/data labels) — all self-hosted via `@fontsource`, no external font requests
- The hero and offices sections are styled like a cargo waybill/manifest, echoing the freight-forwarding subject matter
- All company details (licenses, office addresses, contacts, carrier lists) are pulled directly from `COMPANY_PROFILE-ST_Global.docx`
