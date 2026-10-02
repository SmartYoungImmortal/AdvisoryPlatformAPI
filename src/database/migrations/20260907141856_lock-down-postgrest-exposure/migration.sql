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
--
-- `anon` and `authenticated` are Supabase's own roles, and this migration also runs
-- against the plain Postgres the test suites use, which has neither. The revokes are
-- therefore guarded on the role existing rather than written straight — written
-- straight they failed the test database's migration with `role "anon" does not
-- exist`.

--> statement-breakpoint
DO $$
DECLARE
  supabase_role text;
BEGIN
  FOREACH supabase_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = supabase_role) THEN
      CONTINUE;
    END IF;

    -- 1. Withdraw the blanket grants Supabase gives the role.
    EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', supabase_role);
    EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', supabase_role);
    EXECUTE format('REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM %I', supabase_role);

    -- 2. Same withdrawal for tables that later migrations have not created yet,
    -- so a new table is never briefly public between its migration and this one.
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I',
      supabase_role
    );
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I',
      supabase_role
    );
  END LOOP;
END $$;
--> statement-breakpoint

-- 3. Defence in depth. RLS with zero policies denies every role except the table
-- owner. The role that ran the migrations owns these tables and bypasses RLS, so
-- neither the API nor the test suites are affected — this only matters if a grant is
-- ever restored by accident.
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
