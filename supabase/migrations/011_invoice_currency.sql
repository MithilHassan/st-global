-- Migration 011 — Invoice currency
-- Adds a currency selector for the invoice's Unit Price/Amount columns
-- (and Total/Paid/Balance, and the "in words" wording). Defaults to USD
-- for every existing invoice, so nothing changes until someone picks a
-- different one from the dropdown. Safe to re-run.

alter table invoices add column if not exists currency text not null default 'USD';
