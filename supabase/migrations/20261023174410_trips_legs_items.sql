-- Trips. A trip is a run of legs (a city with its own dates) and the places
-- we pull into it, each either on a day or on the maybe shelf (day is null).
-- A trip with no dated legs is a draft.
--
-- Every table carries space_id, and composite foreign keys make the database
-- refuse a leg, item or save that belongs to a different space than its trip.

-- Lets trip_items reference a save together with its space.
alter table public.saves add constraint saves_id_space_unique unique (id, space_id);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, space_id)
);

create index trips_space_created_idx on public.trips (space_id, created_at desc);

create table public.trip_legs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  space_id uuid not null,
  city text not null check (char_length(city) between 1 and 80),
  starts_on date,
  ends_on date,
  position integer not null default 0,
  foreign key (trip_id, space_id) references public.trips (id, space_id) on delete cascade,
  check ((starts_on is null) = (ends_on is null)),
  check (ends_on >= starts_on),
  check (ends_on - starts_on <= 90)
);

create index trip_legs_trip_idx on public.trip_legs (trip_id, starts_on);
create index trip_legs_space_idx on public.trip_legs (space_id);

create table public.trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null,
  space_id uuid not null,
  save_id uuid not null,
  day date,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  foreign key (trip_id, space_id) references public.trips (id, space_id) on delete cascade,
  foreign key (save_id, space_id) references public.saves (id, space_id) on delete cascade,
  unique (trip_id, save_id)
);

create index trip_items_trip_day_idx on public.trip_items (trip_id, day);
create index trip_items_space_idx on public.trip_items (space_id);
create index trip_items_save_idx on public.trip_items (save_id);

-- After legs change, anything on a day no dated leg covers goes back to the
-- maybe shelf. Runs as the caller, so RLS applies.
create function public.reconcile_trip_days(target uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.trip_items i
  set day = null
  where i.trip_id = target
    and i.day is not null
    and not exists (
      select 1 from public.trip_legs l
      where l.trip_id = i.trip_id
        and i.day between l.starts_on and l.ends_on
    );
$$;

revoke all on function public.reconcile_trip_days(uuid) from public, anon;
grant execute on function public.reconcile_trip_days(uuid) to authenticated, service_role;

-- Grants, RLS, policies.

grant select, insert, update, delete on public.trips to authenticated, service_role;
grant select, insert, update, delete on public.trip_legs to authenticated, service_role;
grant select, insert, update, delete on public.trip_items to authenticated, service_role;

alter table public.trips enable row level security;
alter table public.trip_legs enable row level security;
alter table public.trip_items enable row level security;

create policy trips_member_read on public.trips
  for select to authenticated using ((select public.is_space_member(space_id)));
create policy trips_member_insert on public.trips
  for insert to authenticated
  with check ((select public.is_space_member(space_id)) and created_by = (select auth.uid()));
create policy trips_member_update on public.trips
  for update to authenticated
  using ((select public.is_space_member(space_id)))
  with check ((select public.is_space_member(space_id)));
create policy trips_member_delete on public.trips
  for delete to authenticated using ((select public.is_space_member(space_id)));

create policy trip_legs_member_read on public.trip_legs
  for select to authenticated using ((select public.is_space_member(space_id)));
create policy trip_legs_member_insert on public.trip_legs
  for insert to authenticated with check ((select public.is_space_member(space_id)));
create policy trip_legs_member_update on public.trip_legs
  for update to authenticated
  using ((select public.is_space_member(space_id)))
  with check ((select public.is_space_member(space_id)));
create policy trip_legs_member_delete on public.trip_legs
  for delete to authenticated using ((select public.is_space_member(space_id)));

create policy trip_items_member_read on public.trip_items
  for select to authenticated using ((select public.is_space_member(space_id)));
create policy trip_items_member_insert on public.trip_items
  for insert to authenticated with check ((select public.is_space_member(space_id)));
create policy trip_items_member_update on public.trip_items
  for update to authenticated
  using ((select public.is_space_member(space_id)))
  with check ((select public.is_space_member(space_id)));
create policy trip_items_member_delete on public.trip_items
  for delete to authenticated using ((select public.is_space_member(space_id)));
