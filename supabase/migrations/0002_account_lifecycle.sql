-- VitaTwin — account lifecycle
--
-- Lets a signed-in user delete their own account with the anon key + their
-- session (no service-role key anywhere in the app). Deleting the auth user
-- cascades to public.profiles and public.twin_snapshots (see 0001_init.sql).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
