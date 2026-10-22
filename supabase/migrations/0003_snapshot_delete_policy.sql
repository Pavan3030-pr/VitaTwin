-- VitaTwin — make sure users can delete their own saved snapshots.
-- Idempotent: safe to run more than once, and safe if 0001 already created these.

drop policy if exists "snapshots are self-deletable" on public.twin_snapshots;
create policy "snapshots are self-deletable"
  on public.twin_snapshots for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.twin_snapshots to authenticated;

notify pgrst, 'reload schema';
