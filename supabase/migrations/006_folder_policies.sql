-- 006_folder_policies.sql

alter table app_notes.folders enable row level security;
alter table app_notes.folder_items enable row level security;

-- folders policies

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

-- folder_items policies

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
