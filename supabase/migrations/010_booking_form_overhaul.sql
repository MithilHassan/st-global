-- Migration 010 — Booking form overhaul
-- Reworks the booking form's field set per the new spec:
--   - Special Instructions -> Commodity Declaration (comma-separated,
--     split into individual invoice line items later)
--   - Full Name -> Shipper Name, Company -> Consignee Name,
--     Shipping Address -> Bill To (kept separate from shipper/consignee)
--   - Phone/Email are no longer collected on the form, so both columns
--     become nullable (existing rows are untouched)
--   - New: multiple structured Dimensions, Volume, Manual Tracking
--     Number (used AS the tracking number when provided — see below),
--     ETD, ETA
-- Safe to re-run.

alter table bookings alter column shipper_email drop not null;
alter table bookings alter column shipper_phone drop not null;

alter table bookings add column if not exists commodity_declaration text;
alter table bookings add column if not exists dimensions_list jsonb not null default '[]'::jsonb;
alter table bookings add column if not exists volume text;
alter table bookings add column if not exists bill_to text;
alter table bookings add column if not exists etd date;
alter table bookings add column if not exists eta date;

alter table invoices add column if not exists volume text;

drop function if exists create_booking(
  text, text, text, text, text, numeric, integer, text, text, text, text, text, text
);

create or replace function create_booking(
  p_service text,
  p_goods_type text,
  p_commodity_declaration text,
  p_origin text,
  p_destination text,
  p_gross_weight_kg numeric,
  p_packages integer,
  p_dimensions_list jsonb,
  p_volume text,
  p_manual_tracking_number text,
  p_shipper_name text,
  p_consignee_name text,
  p_bill_to text,
  p_etd date,
  p_eta date
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
  v_manual text;
begin
  if coalesce(trim(p_service), '') = '' then
    raise exception 'service is required';
  end if;
  if coalesce(trim(p_goods_type), '') = '' then
    raise exception 'type of goods is required';
  end if;
  if coalesce(trim(p_shipper_name), '') = '' then
    raise exception 'shipper name is required';
  end if;
  if coalesce(trim(p_bill_to), '') = '' then
    raise exception 'bill to is required';
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

  v_manual := upper(trim(coalesce(p_manual_tracking_number, '')));

  if v_manual <> '' then
    -- A manually-supplied tracking number is used as-is (uppercased, to
    -- match how track_shipment() looks numbers up) — it becomes THE
    -- tracking number, not a second parallel field, so every existing
    -- lookup/display/email path picks it up automatically. One insert
    -- attempt only; a clash is reported back rather than silently
    -- swapped for a random one.
    begin
      insert into bookings (
        tracking_number, mode, service_type, goods_type, commodity_declaration,
        origin, destination, weight_kg, packages, dimensions_list, volume,
        shipper_name, consignee_name, bill_to, etd, eta
      ) values (
        v_manual, v_mode, trim(p_service), trim(p_goods_type), nullif(trim(p_commodity_declaration), ''),
        trim(p_origin), trim(p_destination), p_gross_weight_kg, p_packages,
        coalesce(p_dimensions_list, '[]'::jsonb), nullif(trim(p_volume), ''),
        trim(p_shipper_name), nullif(trim(p_consignee_name), ''), trim(p_bill_to), p_etd, p_eta
      )
      returning id into v_booking_id;
    exception when unique_violation then
      raise exception 'That tracking number is already in use — choose a different one.';
    end;
    v_tracking_number := v_manual;
  else
    loop
      v_tracking_number := 'STG-' || to_char(now(), 'YYYY') ||
        '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      begin
        insert into bookings (
          tracking_number, mode, service_type, goods_type, commodity_declaration,
          origin, destination, weight_kg, packages, dimensions_list, volume,
          shipper_name, consignee_name, bill_to, etd, eta
        ) values (
          v_tracking_number, v_mode, trim(p_service), trim(p_goods_type), nullif(trim(p_commodity_declaration), ''),
          trim(p_origin), trim(p_destination), p_gross_weight_kg, p_packages,
          coalesce(p_dimensions_list, '[]'::jsonb), nullif(trim(p_volume), ''),
          trim(p_shipper_name), nullif(trim(p_consignee_name), ''), trim(p_bill_to), p_etd, p_eta
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
  end if;

  insert into booking_events (booking_id, status, note)
  values (v_booking_id, 'booking_received', 'Booking received by ST Global Forwarding.');

  return v_tracking_number;
end;
$$;

grant execute on function create_booking(
  text, text, text, text, text, numeric, integer, jsonb, text, text, text, text, text, date, date
) to anon, authenticated;
