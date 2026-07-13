-- SODA VISUALS — Crew Operations Engine (Mission 04.4.1)
-- Additive only: notes on people for Founder profile editing.
-- DOES NOT create Auth users, people rows, or demo data.

alter table public.people
  add column if not exists notes text;

comment on column public.people.notes is
  'Internal Founder notes for this crew member — empty until recorded';
