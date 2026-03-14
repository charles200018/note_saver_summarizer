-- 001_create_schema.sql
-- Isolates all app objects under a dedicated schema to avoid collisions
-- with other apps in the same Supabase project.

create schema if not exists app_notes;

-- Keep anonymous users from discovering objects in this app schema.
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
