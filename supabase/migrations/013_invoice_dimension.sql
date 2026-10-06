-- Migration 013 — Invoice Dimension
-- Adds dimension column to invoices table so it can be edited and stored

alter table invoices add column if not exists dimension text;
