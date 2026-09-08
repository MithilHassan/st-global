-- Migration 006 — Super admin flag
-- Restricts who can create/remove admin accounts. The shared "master"
-- password (ADMIN_PASSWORD / Settings override) is always treated as
-- super admin, regardless of this table's contents — so there's no way
-- to lock everyone out of admin management. Named admin accounts are
-- regular staff by default; this column lets a super admin promote one
-- at creation time.
-- Safe to re-run.

alter table admin_users
  add column if not exists is_super_admin boolean not null default false;
