-- Foreign keys without a leading-column index (database audit warning).
-- Small now; they keep joins and deletes on auth.users from scanning later.
-- Also the first migration to reach production through the GitHub
-- integration rather than by hand.

create index saves_added_by_idx on public.saves (added_by);
create index trips_created_by_idx on public.trips (created_by);
