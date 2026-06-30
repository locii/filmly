-- User-editable profile details. Lets people set a proper display name (used for
-- public stack attribution) plus a small footprint. Email stays the private
-- identity column; these are the fields a user fills in themselves.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists website text,
  add column if not exists updated_at timestamptz default now();
