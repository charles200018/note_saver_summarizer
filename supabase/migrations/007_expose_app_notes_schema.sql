-- 007_expose_app_notes_schema.sql
-- Ensure app_notes is exposed to PostgREST and role privileges are present.

alter role authenticator
  set pgrst.db_schemas = 'public,storage,graphql_public,app_notes';

notify pgrst, 'reload config';

grant usage on schema app_notes to anon, authenticated, service_role;

grant all privileges on all tables in schema app_notes to anon, authenticated, service_role;
grant all privileges on all sequences in schema app_notes to anon, authenticated, service_role;
grant all privileges on all routines in schema app_notes to anon, authenticated, service_role;

alter default privileges in schema app_notes
  grant all privileges on tables to anon, authenticated, service_role;

alter default privileges in schema app_notes
  grant all privileges on sequences to anon, authenticated, service_role;

alter default privileges in schema app_notes
  grant all privileges on routines to anon, authenticated, service_role;
