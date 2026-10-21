-- Run in the Supabase SQL editor (or `psql "$SUPABASE_DB_URL" -f supabase/tests/verify-rls.sql`).
-- 1) Every table in `public` must have row level security ON: expect ZERO rows.
select schemaname, tablename as table_without_rls
from pg_tables
where schemaname = 'public' and rowsecurity = false;

-- 2) Every table in `public` should have at least one policy: expect ZERO rows.
select t.tablename as table_without_policy
from pg_tables t
left join pg_policies p on p.schemaname = t.schemaname and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename
having count(p.policyname) = 0;

-- 3) The anonymous role must not be able to run the delete function: expect `false`.
select has_function_privilege('anon', 'public.delete_my_account()', 'execute') as anon_can_delete;
