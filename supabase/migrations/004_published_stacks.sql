-- Published discover results ("stacks") — public, shareable snapshots at /stacks/[slug]

create table public.published_stacks (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  query text not null,
  films jsonb not null default '[]'::jsonb,   -- snapshot of Film[] in display order
  total_titles integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index published_stacks_slug_idx on public.published_stacks(slug);

alter table public.published_stacks enable row level security;

-- Anyone (including anonymous visitors) can read a published stack
create policy "Public can view stacks"
  on public.published_stacks for select
  using (true);

-- Only a signed-in user, inserting as themselves, can publish
create policy "Signed-in users can publish"
  on public.published_stacks for insert
  with check (auth.uid() = created_by);
