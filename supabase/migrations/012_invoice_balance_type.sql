-- Migration 012 — Invoice balance type
-- Turns the "Balance" row's label into a Due/Discount selector, so staff
-- can mark a remaining balance as either still owed or written off as a
-- discount. Defaults to 'due' for every existing invoice — nothing
-- changes until someone picks Discount from the dropdown.
-- Safe to re-run.

alter table invoices add column if not exists balance_type text not null default 'due';
