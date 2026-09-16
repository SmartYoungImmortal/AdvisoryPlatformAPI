-- Close the PostgREST door that Supabase opens by default.
--
-- Supabase publishes every table in `public` over PostgREST at
-- <project>.supabase.co/rest/v1, authenticated with the publishable ("anon") key —
-- a key that is designed to ship inside frontend code. Verified on this project
-- before the migration: GET /rest/v1/account returned 200, and POST /rest/v1/skills
-- reached column validation (PGRST204) rather than a permission error, so anonymous
-- reads *and* writes were both allowed on all 40 tables. `public.account` holds
-- better-auth's password hash, access_token and refresh_token.
--
-- This API is not part of the architecture. Authorization lives in NestJS, which
-- reaches Postgres over the wire protocol as the `postgres` role. Nothing in the
-- application reads PostgREST, so the whole surface can be removed.

--> statement-breakpoint
-- 1. Withdraw the blanket grants Supabase gives `anon` and `authenticated`.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint

-- 2. Same withdrawal for tables that later migrations have not created yet,
-- so a new table is never briefly public between its migration and this one.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
--> statement-breakpoint

-- 3. Defence in depth. RLS with zero policies denies every role except the table
-- owner. `postgres` owns these tables and bypasses RLS, so the API is unaffected —
-- this only matters if a grant is ever restored by accident.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.tablename);
  END LOOP;
END $$;
