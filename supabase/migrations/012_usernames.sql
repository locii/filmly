-- Unique handles + friendly auto-assigned identities.

alter table public.profiles
  add column if not exists username text;

-- Case-insensitive uniqueness. NULLs are allowed and stay distinct, so users
-- without a handle don't collide.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Format: 3–30 chars, lowercase letters / digits / underscore. NULL allowed.
alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9_]{3,30}$');

-- Denormalised handle on stacks so public pages can link to and resolve a
-- curator without reading other users' (RLS-protected) profiles. Mirrors
-- author_name; re-stamped when the user changes their handle.
alter table public.published_stacks
  add column if not exists author_username text;

-- A friendly random display name like "Midnight Cinephile".
create or replace function public.random_display_name()
returns text language sql volatile as $$
  select (array['Crimson','Midnight','Golden','Silver','Velvet','Neon','Quiet','Lonely',
                'Electric','Cosmic','Rusty','Hidden','Wandering','Restless','Gentle',
                'Savage','Mellow','Vivid','Faded','Northern'])[floor(random()*20)+1]
      || ' ' ||
         (array['Reel','Frame','Cinephile','Projector','Auteur','Marquee','Matinee',
                'Noir','Cut','Take','Viewer','Critic','Usher','Screen','Flicker','Scene',
                'Gaffer','Director','Reeler','Dreamer'])[floor(random()*20)+1];
$$;

-- Turn a display name into a unique handle by slugifying + a random suffix.
create or replace function public.unique_username_from(display text)
returns text language plpgsql volatile as $$
declare
  base text;
  candidate text;
begin
  base := trim(both '_' from regexp_replace(lower(display), '[^a-z0-9]+', '_', 'g'));
  base := left(nullif(base, ''), 20);
  if base is null then base := 'cinephile'; end if;
  loop
    candidate := left(base || '_' || floor(random()*10000)::int::text, 30);
    exit when not exists (select 1 from public.profiles where lower(username) = candidate);
  end loop;
  return candidate;
end;
$$;

-- Auto-create a profile with a random identity on signup. Users can edit it.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  display text := public.random_display_name();
begin
  insert into public.profiles (id, email, display_name, username)
  values (new.id, new.email, display, public.unique_username_from(display));
  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing users who predate auto-identities.
do $$
declare
  r record;
  d text;
begin
  for r in select id, display_name from public.profiles where username is null loop
    d := coalesce(nullif(trim(r.display_name), ''), public.random_display_name());
    update public.profiles
      set display_name = d,
          username = public.unique_username_from(d)
      where id = r.id;
  end loop;
end $$;

-- Re-stamp existing stacks with their owner's (now-populated) name + handle.
update public.published_stacks s
   set author_name = coalesce(p.display_name, s.author_name),
       author_username = p.username
  from public.profiles p
 where p.id = s.created_by;
