-- Rover Portfolio / Supabase schema
-- Run this in a NEW Supabase project dedicated to the portfolio.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo', 'film', 'application', 'creative')),
  title text not null,
  title_ar text,
  subtitle text,
  description text,
  category text,
  cover_url text,
  video_url text,
  external_url text,
  year text,
  duration text,
  tags jsonb not null default '[]'::jsonb check (jsonb_typeof(tags) = 'array'),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.site_settings enable row level security;

-- Explicit Data API grants. RLS below still controls which rows are accessible.
grant select on public.portfolio_items to anon;
grant select, insert, update, delete on public.portfolio_items to authenticated;
grant select on public.site_settings to anon;
grant select, insert, update, delete on public.site_settings to authenticated;
grant select on public.admin_users to authenticated;

-- The signed-in user may only discover whether their own account is an admin.
create policy "admin can read own membership"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = id);

-- Anonymous visitors only see published work.
create policy "published portfolio is public"
on public.portfolio_items
for select
to anon
using (is_published = true);

-- Signed-in users see published work; administrators can also read drafts.
create policy "authenticated portfolio access"
on public.portfolio_items
for select
to authenticated
using (
  is_published = true
  or exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "admins can insert portfolio"
on public.portfolio_items
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "admins can update portfolio"
on public.portfolio_items
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "admins can delete portfolio"
on public.portfolio_items
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "site settings are public"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "admins can insert settings"
on public.site_settings
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "admins can update settings"
on public.site_settings
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "admins can delete settings"
on public.site_settings
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists portfolio_items_updated_at on public.portfolio_items;
create trigger portfolio_items_updated_at
before update on public.portfolio_items
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- Public portfolio media bucket. Upload/update/delete is still restricted by storage RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  104857600,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public can read portfolio media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

create policy "admins can upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "admins can update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
)
with check (
  bucket_id = 'portfolio-media'
  and exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

create policy "admins can delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid())
  )
);

-- After creating your admin user in Authentication > Users, run this once:
-- insert into public.admin_users (id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
