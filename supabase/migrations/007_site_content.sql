-- Migration 007 — Site content (CMS)
-- A small key/value table backing the admin "Content" page: editable
-- blocks of the public homepage (hero, stats, offices, company profile,
-- key contacts, footer). Each key holds one JSON block matching the
-- shape in lib/content.ts. Purely additive — while empty, the site
-- renders the same hardcoded defaults it always has.
-- Safe to re-run.

create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS: same pattern as the other admin-managed tables — no anon/
-- authenticated policies. Only the service-role client can read or
-- write this (both from /api/admin/content and from the public
-- homepage's server-side render).
alter table site_content enable row level security;
