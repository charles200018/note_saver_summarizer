-- 005_folders_tables.sql

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

create index if not exists idx_app_notes_folders_user_id
  on app_notes.folders (user_id);

create index if not exists idx_app_notes_folder_items_folder_id
  on app_notes.folder_items (folder_id);

create index if not exists idx_app_notes_folder_items_item
  on app_notes.folder_items (item_type, item_id);

drop trigger if exists trg_app_notes_folders_updated_at on app_notes.folders;
create trigger trg_app_notes_folders_updated_at
  before update on app_notes.folders
  for each row
  execute function app_notes.handle_updated_at();
