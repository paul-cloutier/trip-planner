-- A signed-in user could read every row of places, including spots only another
-- space had saved. Nothing a person wrote lives there, but which places a space
-- cares about is still its business. Now a place is readable only while one of
-- the caller's spaces has a save on it. saves has its own RLS, so the subquery
-- already sees only the caller's spaces; saves_place_id_idx makes the probe cheap.
-- Server code that writes places uses the service role and is unaffected.

drop policy places_signed_in_read on public.places;

create policy places_read_through_saves on public.places
  for select to authenticated
  using (exists (select 1 from public.saves s where s.place_id = places.id));
