-- Directors (people) a user follows. Mirrors film_interactions: small denormalised
-- snapshot (name, profile photo) so the "Directors I follow" list renders without
-- a TMDB round-trip, with the latest films fetched on demand.

create table public.followed_people (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  person_id integer not null,
  name text not null,
  profile_path text,
  known_for_department text,
  created_at timestamptz default now(),
  unique(user_id, person_id)
);

create index followed_people_user_id_idx on public.followed_people(user_id);

alter table public.followed_people enable row level security;

create policy "Users can view own follows"
  on public.followed_people for select
  using (auth.uid() = user_id);

create policy "Users can insert own follows"
  on public.followed_people for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own follows"
  on public.followed_people for delete
  using (auth.uid() = user_id);
