-- Run this migration on the existing Rover Supabase project to enable visitor likes.
create table if not exists public.photo_likes (
  photo_id uuid not null references public.portfolio_items(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (photo_id, visitor_id)
);

alter table public.photo_likes enable row level security;
revoke all on public.photo_likes from anon, authenticated;

create or replace function public.get_photo_like_states(p_photo_ids uuid[], p_visitor_id uuid)
returns table(photo_id uuid, like_count bigint, liked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    item.id,
    count(photo_like.photo_id)::bigint,
    coalesce(bool_or(photo_like.visitor_id = p_visitor_id), false)
  from public.portfolio_items as item
  left join public.photo_likes as photo_like on photo_like.photo_id = item.id
  where item.id = any(coalesce(p_photo_ids, array[]::uuid[]))
    and item.kind = 'photo'
    and item.is_published = true
  group by item.id;
$$;

create or replace function public.set_photo_like(p_photo_id uuid, p_visitor_id uuid, p_liked boolean)
returns table(photo_id uuid, like_count bigint, liked boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_photo_id is null or p_visitor_id is null or p_liked is null then
    return;
  end if;

  if not exists (
    select 1 from public.portfolio_items as item
    where item.id = p_photo_id and item.kind = 'photo' and item.is_published = true
  ) then
    return;
  end if;

  if p_liked then
    insert into public.photo_likes (photo_id, visitor_id)
    values (p_photo_id, p_visitor_id)
    on conflict (photo_id, visitor_id) do nothing;
  else
    delete from public.photo_likes
    where photo_likes.photo_id = p_photo_id
      and photo_likes.visitor_id = p_visitor_id;
  end if;

  return query
    select
      item.id,
      count(photo_like.photo_id)::bigint,
      coalesce(bool_or(photo_like.visitor_id = p_visitor_id), false)
    from public.portfolio_items as item
    left join public.photo_likes as photo_like on photo_like.photo_id = item.id
    where item.id = p_photo_id
    group by item.id;
end;
$$;

revoke all on function public.get_photo_like_states(uuid[], uuid) from public, anon, authenticated;
revoke all on function public.set_photo_like(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.get_photo_like_states(uuid[], uuid) to anon, authenticated;
grant execute on function public.set_photo_like(uuid, uuid, boolean) to anon, authenticated;
