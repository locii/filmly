-- Denormalised author display name for stacks. profiles are private (RLS limits
-- reads to the owner), so we snapshot a public-safe display name onto the stack
-- itself at creation time for attribution on the public stack pages.

alter table public.published_stacks
  add column if not exists author_name text;
