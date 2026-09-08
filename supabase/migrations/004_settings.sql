-- Migration 004 — App settings
-- A small key/value table backing the admin Settings page: an overridable
-- admin password (so it can be changed from the UI instead of editing env
-- vars + redeploying) and an overridable ops-notification email address.
-- Both fall back to their environment variables when no row exists, so
-- this is purely additive — nothing breaks if the table is empty.
-- Safe to re-run.

create table if not exists app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

-- RLS: same pattern as bookings/invoices — no direct anon/authenticated
-- access. Only the service-role client used by /api/admin/* routes (and
-- the login route, to check a custom password) can read or write this.
alter table app_settings enable row level security;
