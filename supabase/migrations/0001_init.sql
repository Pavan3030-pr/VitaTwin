-- VitaTwin — initial schema (Supabase Postgres)
--
-- Two tables, both owned by the signed-in user through auth.uid().
-- RLS is the access-control boundary: the anon key is public, so nothing is
-- readable or writable unless a policy allows it (SECURITY.md).
--
-- All app data is synthetic. No real PHI is stored.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.twin_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  twin_id text not null,
  payload jsonb not null,
  captured_at timestamptz not null default now()
);

create index if not exists twin_snapshots_user_captured_idx
  on public.twin_snapshots (user_id, captured_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.twin_snapshots enable row level security;

drop policy if exists "profiles are self-readable" on public.profiles;
create policy "profiles are self-readable"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles are self-insertable" on public.profiles;
create policy "profiles are self-insertable"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles are self-updatable" on public.profiles;
create policy "profiles are self-updatable"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "snapshots are self-readable" on public.twin_snapshots;
create policy "snapshots are self-readable"
  on public.twin_snapshots for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "snapshots are self-writable" on public.twin_snapshots;
create policy "snapshots are self-writable"
  on public.twin_snapshots for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "snapshots are self-deletable" on public.twin_snapshots;
create policy "snapshots are self-deletable"
  on public.twin_snapshots for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants (RLS still filters every row)
-- ---------------------------------------------------------------------------

grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.twin_snapshots to authenticated;
revoke all on public.profiles from anon;
revoke all on public.twin_snapshots from anon;

-- ---------------------------------------------------------------------------
-- Profile bootstrap on sign-up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
