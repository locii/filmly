-- Genres a user follows. Mirrors followed_people: a tiny snapshot (genre id +
-- name) per user, with films fetched on demand for the "Genres I follow" list.

create table public.followed_genres (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  genre_id integer not null,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, genre_id)
);

create index followed_genres_user_id_idx on public.followed_genres(user_id);

alter table public.followed_genres enable row level security;

create policy "Users can view own genre follows"
  on public.followed_genres for select
  using (auth.uid() = user_id);

create policy "Users can insert own genre follows"
  on public.followed_genres for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own genre follows"
  on public.followed_genres for delete
  using (auth.uid() = user_id);
