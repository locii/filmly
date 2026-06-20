-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

-- User film interactions (likes / dislikes / favourites)
create table public.film_interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  interaction text not null check (interaction in ('like', 'dislike', 'favourite')),
  created_at timestamptz default now(),
  unique(user_id, tmdb_id, interaction)
);

-- Index for fast lookups by user
create index film_interactions_user_id_idx on public.film_interactions(user_id);
create index film_interactions_tmdb_id_idx on public.film_interactions(tmdb_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.film_interactions enable row level security;

-- Profiles: users can only read/update their own
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Film interactions: users can only CRUD their own
create policy "Users can view own interactions"
  on public.film_interactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own interactions"
  on public.film_interactions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own interactions"
  on public.film_interactions for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
