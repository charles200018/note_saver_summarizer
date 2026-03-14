# Notes Saver + AI YouTube Summarizer

Next.js 16 application with Supabase Auth + Postgres + Storage, designed for safe use in a shared Supabase instance.

## Architecture Highlights

- Isolated app schema: `app_notes`
- Strict RLS policies bound to `auth.uid() = user_id`
- Private storage buckets with user-path ownership checks
- Route protection through Next.js `proxy.ts`
- OAuth callback hardened for Vercel deployments
- Server-only use of sensitive environment variables

## Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `GROQ_API_KEY` (server-only)
- `NEXT_PUBLIC_SITE_URL` (recommended)

## Migration Structure

```text
supabase/
  migrations/
    001_create_schema.sql
    002_notes_table.sql
    003_youtube_table.sql
    004_rls_policies.sql
    005_folders_tables.sql
    006_folder_policies.sql
```

## Run Migrations Safely

Option A: Supabase SQL Editor

1. Open SQL Editor in your Supabase project.
2. Run each migration file in order from `001` to `006`.
3. Verify all app tables exist only in `app_notes` schema.

Option B: Supabase CLI

1. Link project: `supabase link --project-ref <project-ref>`
2. Push migrations: `supabase db push`

## Auth Flow

- Unauthenticated requests to `/dashboard`, `/notes/*`, `/youtube/*` are redirected to `/login`.
- Login uses Supabase OAuth with callback at `/auth/callback`.
- Callback exchanges code for session and redirects safely to a validated `next` path.

## Storage Ownership Convention

All objects must be uploaded with key format:

```text
<user_id>/<filename>
```

Policies only allow access where first path segment equals the authenticated user id.

## App Tables In Shared Supabase

All application-owned tables now live in `app_notes`:

- `notes`
- `youtube_summaries`
- `folders`
- `folder_items`
