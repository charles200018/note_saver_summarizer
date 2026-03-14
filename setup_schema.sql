-- Consolidated setup script for Notes Saver + AI YouTube Summarizer
-- Safe for shared Supabase instances: all app data lives in app_notes schema.

create schema if not exists app_notes;
revoke all on schema app_notes from public;
grant usage on schema app_notes to authenticated;

create extension if not exists pgcrypto;

create or replace function app_notes.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists app_notes.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists app_notes.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_notes.folder_items (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references app_notes.folders(id) on delete cascade,
  item_type text not null check (item_type in ('note', 'youtube_summary')),
  item_id uuid not null,
  added_at timestamptz not null default now(),
  unique(folder_id, item_type, item_id)
);

create index if not exists idx_app_notes_notes_user_id
  on app_notes.notes (user_id);
create index if not exists idx_app_notes_notes_updated_at
  on app_notes.notes (updated_at desc);
create index if not exists idx_app_notes_youtube_summaries_user_id
  on app_notes.youtube_summaries (user_id);
create index if not exists idx_app_notes_youtube_summaries_created_at
  on app_notes.youtube_summaries (created_at desc);
create index if not exists idx_app_notes_folders_user_id
  on app_notes.folders (user_id);
create index if not exists idx_app_notes_folder_items_folder_id
  on app_notes.folder_items (folder_id);
create index if not exists idx_app_notes_folder_items_item
  on app_notes.folder_items (item_type, item_id);

drop trigger if exists trg_app_notes_notes_updated_at on app_notes.notes;
create trigger trg_app_notes_notes_updated_at
  before update on app_notes.notes
  for each row
  execute function app_notes.handle_updated_at();

drop trigger if exists trg_app_notes_folders_updated_at on app_notes.folders;
create trigger trg_app_notes_folders_updated_at
  before update on app_notes.folders
  for each row
  execute function app_notes.handle_updated_at();

alter table app_notes.notes enable row level security;
alter table app_notes.youtube_summaries enable row level security;
alter table app_notes.folders enable row level security;
alter table app_notes.folder_items enable row level security;

-- notes RLS

drop policy if exists notes_select_own on app_notes.notes;
create policy notes_select_own
  on app_notes.notes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists notes_insert_own on app_notes.notes;
create policy notes_insert_own
  on app_notes.notes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists notes_update_own on app_notes.notes;
create policy notes_update_own
  on app_notes.notes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists notes_delete_own on app_notes.notes;
create policy notes_delete_own
  on app_notes.notes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- youtube_summaries RLS

drop policy if exists youtube_summaries_select_own on app_notes.youtube_summaries;
create policy youtube_summaries_select_own
  on app_notes.youtube_summaries
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists youtube_summaries_insert_own on app_notes.youtube_summaries;
create policy youtube_summaries_insert_own
  on app_notes.youtube_summaries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists youtube_summaries_update_own on app_notes.youtube_summaries;
create policy youtube_summaries_update_own
  on app_notes.youtube_summaries
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists youtube_summaries_delete_own on app_notes.youtube_summaries;
create policy youtube_summaries_delete_own
  on app_notes.youtube_summaries
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists folders_select_own on app_notes.folders;
create policy folders_select_own
  on app_notes.folders
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists folders_insert_own on app_notes.folders;
create policy folders_insert_own
  on app_notes.folders
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists folders_update_own on app_notes.folders;
create policy folders_update_own
  on app_notes.folders
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists folders_delete_own on app_notes.folders;
create policy folders_delete_own
  on app_notes.folders
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists folder_items_select_own on app_notes.folder_items;
create policy folder_items_select_own
  on app_notes.folder_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from app_notes.folders
      where folders.id = folder_items.folder_id
        and folders.user_id = auth.uid()
    )
  );

drop policy if exists folder_items_insert_own on app_notes.folder_items;
create policy folder_items_insert_own
  on app_notes.folder_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from app_notes.folders
      where folders.id = folder_items.folder_id
        and folders.user_id = auth.uid()
    )
  );

drop policy if exists folder_items_update_own on app_notes.folder_items;
create policy folder_items_update_own
  on app_notes.folder_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from app_notes.folders
      where folders.id = folder_items.folder_id
        and folders.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from app_notes.folders
      where folders.id = folder_items.folder_id
        and folders.user_id = auth.uid()
    )
  );

drop policy if exists folder_items_delete_own on app_notes.folder_items;
create policy folder_items_delete_own
  on app_notes.folder_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from app_notes.folders
      where folders.id = folder_items.folder_id
        and folders.user_id = auth.uid()
    )
  );

-- Private buckets for this app.
insert into storage.buckets (id, name, public)
values ('notes-files', 'notes-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('youtube-thumbnails', 'youtube-thumbnails', false)
on conflict (id) do nothing;

-- Storage path convention: <user_id>/<filename>

drop policy if exists notes_files_select_own on storage.objects;
create policy notes_files_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'notes-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists notes_files_insert_own on storage.objects;
create policy notes_files_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'notes-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists notes_files_update_own on storage.objects;
create policy notes_files_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'notes-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'notes-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists notes_files_delete_own on storage.objects;
create policy notes_files_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'notes-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists youtube_thumbnails_select_own on storage.objects;
create policy youtube_thumbnails_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'youtube-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists youtube_thumbnails_insert_own on storage.objects;
create policy youtube_thumbnails_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'youtube-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists youtube_thumbnails_update_own on storage.objects;
create policy youtube_thumbnails_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'youtube-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'youtube-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists youtube_thumbnails_delete_own on storage.objects;
create policy youtube_thumbnails_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'youtube-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
