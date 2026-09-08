-- Migration 003 — Invoices
-- Adds an `invoices` table so admin staff can generate an ST Global
-- Forwarding invoice from a booking, edit every field, and save/print it.
-- Safe to re-run.

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete set null,

  invoice_number text,
  invoice_date date,

  bill_to text,
  shipper text,
  consignee text,
  pol text,
  pod text,

  rep text,
  terms text,
  exch_rate numeric,
  truck_callan_no text,
  hbl_no text,
  pkgs numeric,
  etd date,
  eta date,
  weight numeric,

  -- Array of { description, unit, unitPrice } — amount is derived
  -- (unit * unitPrice) rather than stored, so it's always in sync.
  line_items jsonb not null default '[]'::jsonb,

  paid numeric not null default 0,
  in_words text,

  company_phone text default '+88 01719 089697',
  company_email text default 'tapos@stbd.net',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_booking_id_idx on invoices (booking_id);

-- One invoice per booking: lets "Generate invoice" find-or-create instead
-- of piling up duplicates when clicked more than once for the same booking.
create unique index if not exists invoices_booking_id_unique_idx
  on invoices (booking_id)
  where booking_id is not null;

-- RLS: same pattern as bookings — no direct anon/authenticated access.
-- Only the service-role client used by the /api/admin/* routes can read
-- or write invoices.
alter table invoices enable row level security;
