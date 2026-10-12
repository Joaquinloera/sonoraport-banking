-- Disposable CI PostgreSQL roles only. Never run this setup against a SonoraPort Supabase project.
\set ON_ERROR_STOP on
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
END $$;
GRANT USAGE ON SCHEMA public TO service_role;
