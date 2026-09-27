-- Rover V6 personal hub migration
alter table public.portfolio_items add column if not exists subtitle_ar text;
alter table public.portfolio_items add column if not exists description_ar text;

alter table public.portfolio_items drop constraint if exists portfolio_items_kind_check;
alter table public.portfolio_items
  add constraint portfolio_items_kind_check
  check (kind in ('photo','video','movie','music','game','film','application','creative'));

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/gif',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/x-wav'
],
file_size_limit = 104857600
where id='portfolio-media';

alter table public.portfolio_items
  add column if not exists rating numeric(3,1);

alter table public.portfolio_items
  drop constraint if exists portfolio_items_rating_check;

alter table public.portfolio_items
  add constraint portfolio_items_rating_check
  check (rating is null or (rating >= 0 and rating <= 10));

alter table public.portfolio_items
  add column if not exists source_rating_text text,
  add column if not exists source_rating_label text;
