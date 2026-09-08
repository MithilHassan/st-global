-- Migration 008 — Challan
-- Adds a delivery challan (goods receipt) to each invoice, printed right
-- after it. Additive columns on the existing invoices table — nothing
-- else changes. Safe to re-run.

alter table invoices
  add column if not exists challan_no text,
  add column if not exists challan_date date,
  add column if not exists challan_name text,
  add column if not exists challan_address text,
  add column if not exists challan_contact text,
  add column if not exists challan_items jsonb not null default '[]'::jsonb;
