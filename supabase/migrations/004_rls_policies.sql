-- 004_rls_policies.sql

alter table app_notes.notes enable row level security;
alter table app_notes.youtube_summaries enable row level security;

-- Deny all access for anonymous users on notes
drop policy if exists "anon_notes_access" on app_notes.notes;
create policy "anon_notes_access"
  on app_notes.notes
  for all
  to anon
  using (false);

-- Deny all access for anonymous users on youtube_summaries
drop policy if exists "anon_youtube_summaries_access" on app_notes.youtube_summaries;
create policy "anon_youtube_summaries_access"
  on app_notes.youtube_summaries
  for all
  to anon
  using (false);

-- notes policies

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

-- youtube_summaries policies

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

-- Storage buckets (isolated per-app naming)
insert into storage.buckets (id, name, public)
values ('notes-files', 'notes-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('youtube-thumbnails', 'youtube-thumbnails', false)
on conflict (id) do nothing;

-- Storage policies scoped by user folder convention:
-- object path must be: <user_id>/<filename>

-- notes-files

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

-- youtube-thumbnails

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
