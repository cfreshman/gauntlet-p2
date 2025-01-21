-- Drop our publication first (ignore Supabase's internal ones)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Drop all tables in public schema
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Disable RLS temporarily
  SET session_replication_role = 'replica';

  -- Drop tables
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;

  -- Drop functions
  FOR r IN (
    SELECT ns.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p 
    JOIN pg_namespace ns ON p.pronamespace = ns.oid
    WHERE ns.nspname = 'public'
  )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.name) || '(' || r.args || ') CASCADE';
  END LOOP;

  -- Drop types
  FOR r IN (
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace ns ON t.typnamespace = ns.oid
    WHERE ns.nspname = 'public'
    AND t.typtype = 'c'
  )
  LOOP
    EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
  END LOOP;

  -- Drop sequences
  FOR r IN (
    SELECT sequence_name 
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  )
  LOOP
    EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
  END LOOP;

  -- Truncate auth tables (except migrations)
  FOR r IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'auth' 
    AND tablename != 'schema_migrations'
  )
  LOOP
    EXECUTE 'TRUNCATE auth.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;

  -- Drop policies
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  )
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || 
      quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
  END LOOP;

  -- Reset RLS
  SET session_replication_role = 'origin';
END $$;
