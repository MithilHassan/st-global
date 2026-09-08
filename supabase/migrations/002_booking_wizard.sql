-- Migration 002 — 4-step booking wizard fields
-- Run this in the Supabase SQL editor if you already ran the original
-- schema.sql. Safe to re-run (uses IF NOT EXISTS / IF EXISTS throughout).

alter table bookings add column if not exists goods_type text;
alter table bookings add column if not exists packages integer;
alter table bookings add column if not exists dimensions text;

-- The old create_booking had a different parameter list — drop it before
-- creating the new one so we don't end up with two overloads.
drop function if exists create_booking(
  text, text, text, text, text, text, text, text, text, text, text, numeric, date, text, text
);

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

grant execute on function create_booking(
  text, text, text, text, text, numeric, integer, text, text, text, text, text
) to anon, authenticated;
