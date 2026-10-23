-- Projects created before Supabase's Data API change still grant every new
-- table and function to anon and authenticated by default. Row level security
-- already hides every row from anon, but grants are the first layer, so make
-- them say exactly what each migration meant.
-- (The old default comes off for existing projects on 2026-10-30.)

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;

grant select, update on public.spaces to authenticated;
grant select on public.space_members to authenticated;
grant select on public.places to authenticated;
grant select, insert, update, delete on public.saves to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_legs to authenticated;
grant select, insert, update, delete on public.trip_items to authenticated;
-- space_invites: nothing for anon or authenticated; only the trigger and the
-- service role touch it.

revoke all on function public.is_space_member(uuid) from anon;
