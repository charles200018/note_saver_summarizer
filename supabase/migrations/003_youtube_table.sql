-- 003_youtube_table.sql

create table if not exists app_notes.youtube_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_url text not null,
  video_title text not null default '',
  thumbnail_url text not null default '',
  summary text not null default '',
  key_points text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_app_notes_youtube_summaries_user_id
  on app_notes.youtube_summaries (user_id);

create index if not exists idx_app_notes_youtube_summaries_created_at
  on app_notes.youtube_summaries (created_at desc);
