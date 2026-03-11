-- Notes Saver + AI YouTube Summarizer Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Notes table
create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null default '',
  tags text[] default '{}',
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- YouTube summaries table
create table if not exists public.youtube_summaries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  video_url text not null,
  video_title text not null default '',
  thumbnail_url text not null default '',
  summary text not null default '',
  key_points text[] default '{}',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.notes enable row level security;
alter table public.youtube_summaries enable row level security;

-- RLS Policies for notes
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- RLS Policies for youtube_summaries
create policy "Users can view their own summaries"
  on public.youtube_summaries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own summaries"
  on public.youtube_summaries for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own summaries"
  on public.youtube_summaries for delete
  using (auth.uid() = user_id);

-- Function to auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for notes updated_at
create trigger on_notes_updated
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- Indexes for performance
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_notes_created_at on public.notes(created_at desc);
create index if not exists idx_youtube_summaries_user_id on public.youtube_summaries(user_id);
create index if not exists idx_youtube_summaries_created_at on public.youtube_summaries(created_at desc);

-- Folders table for organizing notes and summaries
create table if not exists public.folders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  color text default '#6366f1',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Folder items junction table
create table if not exists public.folder_items (
  id uuid primary key default uuid_generate_v4(),
  folder_id uuid references public.folders(id) on delete cascade not null,
  item_type text not null check (item_type in ('note', 'youtube_summary')),
  item_id uuid not null,
  added_at timestamptz default now(),
  unique(folder_id, item_type, item_id)
);

-- Enable RLS for folders
alter table public.folders enable row level security;
alter table public.folder_items enable row level security;

-- RLS Policies for folders
create policy "Users can view their own folders"
  on public.folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own folders"
  on public.folders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own folders"
  on public.folders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own folders"
  on public.folders for delete
  using (auth.uid() = user_id);

-- RLS Policies for folder_items (users can only manage items in their folders)
create policy "Users can view items in their folders"
  on public.folder_items for select
  using (exists (
    select 1 from public.folders 
    where folders.id = folder_items.folder_id 
    and folders.user_id = auth.uid()
  ));

create policy "Users can add items to their folders"
  on public.folder_items for insert
  with check (exists (
    select 1 from public.folders 
    where folders.id = folder_items.folder_id 
    and folders.user_id = auth.uid()
  ));

create policy "Users can remove items from their folders"
  on public.folder_items for delete
  using (exists (
    select 1 from public.folders 
    where folders.id = folder_items.folder_id 
    and folders.user_id = auth.uid()
  ));

-- Trigger for folders updated_at
create trigger on_folders_updated
  before update on public.folders
  for each row execute function public.handle_updated_at();

-- Indexes for folders
create index if not exists idx_folders_user_id on public.folders(user_id);
create index if not exists idx_folder_items_folder_id on public.folder_items(folder_id);
create index if not exists idx_folder_items_item on public.folder_items(item_type, item_id);
