-- Wedding Design Planner — initial schema
-- Run in Supabase SQL Editor or via CLI migration.
-- Safe to re-run: policies are dropped before recreate; tables use IF NOT EXISTS.

-- Profiles (optional row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Layouts
create table if not exists public.layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  venue_name text not null default 'Garden estate venue',
  location text not null default 'Philippines',
  venue_setting text not null default 'ballroom' check (venue_setting in ('ballroom', 'church', 'outdoor_garden')),
  canvas_width integer not null default 1200,
  canvas_height integer not null default 800,
  layout_json jsonb not null default '{"version":1,"objects":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists layouts_user_id_idx on public.layouts (user_id);
create index if not exists layouts_updated_at_idx on public.layouts (updated_at desc);

alter table public.layouts enable row level security;

drop policy if exists "layouts_select_own" on public.layouts;
drop policy if exists "layouts_insert_own" on public.layouts;
drop policy if exists "layouts_update_own" on public.layouts;
drop policy if exists "layouts_delete_own" on public.layouts;

create policy "layouts_select_own"
  on public.layouts for select
  using (auth.uid() = user_id);

create policy "layouts_insert_own"
  on public.layouts for insert
  with check (auth.uid() = user_id);

create policy "layouts_update_own"
  on public.layouts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "layouts_delete_own"
  on public.layouts for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists layouts_set_updated_at on public.layouts;
create trigger layouts_set_updated_at
  before update on public.layouts
  for each row execute function public.set_updated_at();
