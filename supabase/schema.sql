-- ST Global Forwarding — booking & tracking schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

-- ── Tables ──────────────────────────────────────────────────────────────

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  tracking_number text unique not null,
  mode text not null check (mode in ('air', 'ocean')),
  service_type text,
  goods_type text,
  incoterm text,
  shipper_name text not null,
  shipper_company text,
  shipper_email text not null,
  shipper_phone text not null,
  consignee_name text,
  consignee_address text,
  origin text not null,
  destination text not null,
  cargo_description text,
  weight_kg numeric,
  packages integer,
  dimensions text,
  pickup_date date,
  notes text,
  status text not null default 'booking_received'
    check (status in ('booking_received', 'cargo_received', 'customs_clearance', 'in_transit', 'arrived', 'delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  status text not null,
  note text,
  occurred_at timestamptz not null default now()
);

create index if not exists booking_events_booking_id_idx on booking_events (booking_id);

-- ── Row Level Security ──────────────────────────────────────────────────
-- These tables are NOT directly readable or writable by the public (anon)
-- role. The booking form and tracking page both go through the two
-- SECURITY DEFINER functions below instead. This matters because bookings
-- contains shipper email/phone — a public "select" policy on the table
-- would let anyone with the anon key (which ships in the browser bundle)
-- dump every customer's contact details, not just the one they're
-- tracking.

alter table bookings enable row level security;
alter table booking_events enable row level security;
-- No policies are created for anon/authenticated — direct table access is
-- fully blocked for those roles. Only the functions below (owned by a
-- privileged role) can read or write.

-- ── create_booking ──────────────────────────────────────────────────────
-- Inserts a booking + its first tracking event atomically, generates a
-- unique tracking number, and returns it. Called from the 4-step booking
-- wizard (Service -> Details -> Contact -> Review).

create or replace function create_booking(
  p_service text,
  p_goods_type text,
  p_special_instructions text,
  p_origin text,
  p_destination text,
  p_gross_weight_kg numeric,
  p_packages integer,
  p_dimensions text,
  p_full_name text,
  p_company_name text,
  p_email text,
  p_phone text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tracking_number text;
  v_booking_id uuid;
  v_mode text;
  v_attempt int := 0;
begin
  if coalesce(trim(p_service), '') = '' then
    raise exception 'service is required';
  end if;
  if coalesce(trim(p_goods_type), '') = '' then
    raise exception 'type of goods is required';
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'full name is required';
  end if;
  if coalesce(trim(p_email), '') = '' then
    raise exception 'email is required';
  end if;
  if coalesce(trim(p_phone), '') = '' then
    raise exception 'phone number is required';
  end if;
  if coalesce(trim(p_origin), '') = '' or coalesce(trim(p_destination), '') = '' then
    raise exception 'origin and destination are required';
  end if;
  if p_gross_weight_kg is null or p_gross_weight_kg <= 0 then
    raise exception 'gross weight must be greater than zero';
  end if;
  if p_packages is null or p_packages < 1 then
    raise exception 'number of packages must be at least 1';
  end if;

  -- Service dropdown carries text like "Ocean Freight" or
  -- "Air Freight (Express & General)" — derive the air/ocean mode badge
  -- used on the tracking page and admin list from it.
  v_mode := case when p_service ilike '%ocean%' then 'ocean' else 'air' end;

  loop
    v_tracking_number := 'STG-' || to_char(now(), 'YYYY') ||
      '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into bookings (
        tracking_number, mode, service_type, goods_type, notes,
        origin, destination, weight_kg, packages, dimensions,
        shipper_name, shipper_company, shipper_email, shipper_phone
      ) values (
        v_tracking_number, v_mode, trim(p_service), trim(p_goods_type), nullif(trim(p_special_instructions), ''),
        trim(p_origin), trim(p_destination), p_gross_weight_kg, p_packages, nullif(trim(p_dimensions), ''),
        trim(p_full_name), nullif(trim(p_company_name), ''), trim(p_email), trim(p_phone)
      )
      returning id into v_booking_id;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then
        raise exception 'could not generate a unique tracking number, try again';
      end if;
    end;
  end loop;

  insert into booking_events (booking_id, status, note)
  values (v_booking_id, 'booking_received', 'Booking received by ST Global Forwarding.');

  return v_tracking_number;
end;
$$;

-- ── track_shipment ───────────────────────────────────────────────────────
-- Returns non-sensitive shipment details + event history for one tracking
-- number. Deliberately omits shipper/consignee email & phone — anyone with
-- the tracking number can look up status, but not contact details.

create or replace function track_shipment(p_tracking_number text)
returns table (
  tracking_number text,
  mode text,
  service_type text,
  origin text,
  destination text,
  status text,
  pickup_date date,
  created_at timestamptz,
  events jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    b.tracking_number,
    b.mode,
    b.service_type,
    b.origin,
    b.destination,
    b.status,
    b.pickup_date,
    b.created_at,
    coalesce(
      (select jsonb_agg(jsonb_build_object('status', e.status, 'note', e.note, 'occurred_at', e.occurred_at) order by e.occurred_at asc)
       from booking_events e where e.booking_id = b.id),
      '[]'::jsonb
    ) as events
  from bookings b
  where b.tracking_number = upper(trim(p_tracking_number));
$$;

-- ── Grants ──────────────────────────────────────────────────────────────
-- Let the public (anon) role call the two functions, but nothing else.

grant execute on function create_booking(
  text, text, text, text, text, numeric, integer, text, text, text, text, text
) to anon, authenticated;

grant execute on function track_shipment(text) to anon, authenticated;

-- ── Staff updates ───────────────────────────────────────────────────────
-- Your ops team updates shipment status from the Supabase Table Editor
-- (or a future internal dashboard), e.g.:
--
--   update bookings set status = 'in_transit', updated_at = now()
--   where tracking_number = 'STG-2026-AB12CD';
--
--   insert into booking_events (booking_id, status, note)
--   select id, 'in_transit', 'Departed Dhaka on EK585.'
--   from bookings where tracking_number = 'STG-2026-AB12CD';
