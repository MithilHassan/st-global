-- Migration 005 — Admin users
-- Named admin accounts (name, email, hashed password) that can log in
-- alongside the single shared "master" password from ADMIN_PASSWORD /
-- the Settings page. Additive: an empty table just means nobody has
-- created a named admin yet, and the master password keeps working
-- exactly as before.
-- Safe to re-run.

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Emails are stored lowercased by the app; enforce uniqueness on that.
create unique index if not exists admin_users_email_idx on admin_users (lower(email));

-- RLS: same pattern as the rest of the admin-only tables — no anon/
-- authenticated policies, so only the service-role client (used by
-- /api/admin/* routes and the login route) can read or write this.
alter table admin_users enable row level security;
