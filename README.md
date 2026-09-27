# Rover Portfolio — v3

A cinematic bilingual personal portfolio for **Ali Mohammed (Rover)** built with Next.js, TypeScript and Supabase.

## What is built

- Cinematic responsive portfolio homepage
- Arabic / English switch
- Photography gallery with dynamic categories
- Films & documentaries, including a featured film and video link
- Applications & projects with tags, cover media and external links
- Creative works gallery
- About and contact sections
- `/admin/login` private sign-in screen
- `/admin` content dashboard
- Create, edit, publish/unpublish, feature and delete portfolio items
- Upload cover images to Supabase Storage
- Supabase Auth + Row Level Security
- Public visitors only read published content
- Admin-only database writes and Storage uploads
- Demo-content fallback until Supabase is connected

## 1. Install and run

```bash
npm install
npm run dev
```

Open:

- Portfolio: http://localhost:3000
- Admin: http://localhost:3000/admin

## 2. Supabase status

A dedicated Supabase project named `rover-portfolio` has already been created for Rover in `eu-central-1` (Frankfurt), and `supabase/schema.sql` has already been applied.

The schema creates:

- `admin_users`
- `portfolio_items`
- `site_settings`
- `portfolio-media` Storage bucket
- RLS policies for public read + admin-only writes

## 3. Connect environment variables

The working copy already has `.env.local` configured for Rover's dedicated Supabase project. `.env.local` is ignored by Git. For a fresh clone, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Do **not** expose a Supabase secret/service-role key in this website.

## 4. Create the admin account

In Supabase Dashboard:

1. Authentication → Users → create the admin user with email/password.
2. Copy that user's UUID.
3. In SQL Editor run:

```sql
insert into public.admin_users (id)
values ('YOUR_AUTH_USER_UUID');
```

Now sign in at `/admin/login`.

## Content types

The dashboard supports:

- `photo`
- `film`
- `application`
- `creative`

Each item can store title, Arabic title, description, category, cover image, video URL, external URL, year, duration, tags, order, featured state and published state.

## Security model

The browser only receives the Supabase publishable key. RLS enforces access:

- anonymous visitors: SELECT published portfolio content
- authenticated non-admins: same public content only
- admin user: SELECT all content and INSERT / UPDATE / DELETE
- Storage uploads/updates/deletes: admin only

The admin allow-list lives in `public.admin_users`; authorization does not depend on editable user metadata.

## Before production

Replace demo content and placeholder contact links with Rover's real work, then deploy to Vercel or another Next.js host.
