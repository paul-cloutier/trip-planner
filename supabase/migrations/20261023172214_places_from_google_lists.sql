-- Places no longer have to come from the Google Places API. Imported Google
-- Maps lists carry the older cid instead, and places we drop on our own map
-- will have neither.

alter table public.places alter column google_place_id drop not null;

alter table public.places add column google_cid text unique;

-- A save may not have a category yet: imported places we have not sorted.
alter table public.saves alter column category drop default;
alter table public.saves alter column category drop not null;
