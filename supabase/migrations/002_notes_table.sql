-- 002_notes_table.sql

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

create index if not exists idx_app_notes_notes_user_id
  on app_notes.notes (user_id);

create index if not exists idx_app_notes_notes_updated_at
  on app_notes.notes (updated_at desc);

drop trigger if exists trg_app_notes_notes_updated_at on app_notes.notes;
create trigger trg_app_notes_notes_updated_at
  before update on app_notes.notes
  for each row
  execute function app_notes.handle_updated_at();
