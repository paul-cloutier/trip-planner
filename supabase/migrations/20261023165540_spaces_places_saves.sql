-- A space is the shared pool two people work in. Every save belongs to one.
-- space_id is the tenancy boundary: every policy on user data goes through it.

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create index space_members_user_id_idx on public.space_members (user_id);

-- Pending invitations by email. A new user whose email matches joins that
-- space instead of getting one of their own. Written by hand for now.
create table public.space_invites (
  space_id uuid not null references public.spaces (id) on delete cascade,
  email text not null check (email = lower(email)),
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now(),
  primary key (space_id, email)
);

create index space_invites_email_idx on public.space_invites (email);

-- The real-world spot, as Google knows it. Shared across spaces: it holds only
-- public facts about the place, never anything a person wrote.
create table public.places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text not null unique,
  name text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address text,
  city text,
  country text,
  google_primary_type text,
  google_types text[] not null default '{}',
  fetched_at timestamptz not null default now()
);

create index places_city_idx on public.places (city);

-- Our layer on a place. One per place per space.
create table public.saves (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete restrict,
  added_by uuid references auth.users (id) on delete set null,
  added_at timestamptz not null default now(),
  via text check (char_length(via) <= 200),
  why text check (char_length(why) <= 2000),
  source_url text check (char_length(source_url) <= 2000),
  category text not null default 'see'
    check (category in ('eat', 'coffee', 'drink', 'shop', 'see', 'do', 'stay')),
  tags text[] not null default '{}',
  status text not null default 'want' check (status in ('want', 'been')),
  visited_on date,
  would_return boolean,
  unique (space_id, place_id)
);

create index saves_space_added_idx on public.saves (space_id, added_at desc);
create index saves_place_id_idx on public.saves (place_id);

-- Membership check used by every policy. security definer so the policy on
-- space_members can call it without recursing into itself.
create function public.is_space_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members
    where space_id = target and user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_space_member(uuid) from public;
grant execute on function public.is_space_member(uuid) to authenticated;

-- New user: join the space they were invited to, or start one of their own.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.space_invites%rowtype;
  new_space uuid;
begin
  select * into invite from public.space_invites
  where email = lower(new.email)
  order by created_at
  limit 1;

  if found then
    insert into public.space_members (space_id, user_id, display_name)
    values (invite.space_id, new.id, invite.display_name);
    delete from public.space_invites
    where space_id = invite.space_id and email = invite.email;
  else
    insert into public.spaces (name) values ('Our places') returning id into new_space;
    insert into public.space_members (space_id, user_id, display_name)
    values (new_space, new.id, coalesce(nullif(split_part(new.email, '@', 1), ''), 'Me'));
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security.

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_invites enable row level security;
alter table public.places enable row level security;
alter table public.saves enable row level security;

grant select, update on public.spaces to authenticated;
grant select on public.space_members to authenticated;
grant select on public.places to authenticated;
grant select, insert, update, delete on public.saves to authenticated;
-- space_invites: nothing for authenticated. Only the trigger and server code.

grant select, insert, update, delete on public.spaces to service_role;
grant select, insert, update, delete on public.space_members to service_role;
grant select, insert, update, delete on public.space_invites to service_role;
grant select, insert, update on public.places to service_role;
grant select, insert, update, delete on public.saves to service_role;

create policy spaces_member_read on public.spaces
  for select to authenticated
  using ((select public.is_space_member(id)));

create policy spaces_member_rename on public.spaces
  for update to authenticated
  using ((select public.is_space_member(id)))
  with check ((select public.is_space_member(id)));

create policy space_members_member_read on public.space_members
  for select to authenticated
  using ((select public.is_space_member(space_id)));

-- Places are public facts from Google; any signed-in user may read them.
-- Writes come only from the server's import and save paths (service role).
create policy places_signed_in_read on public.places
  for select to authenticated
  using (true);

create policy saves_member_read on public.saves
  for select to authenticated
  using ((select public.is_space_member(space_id)));

create policy saves_member_insert on public.saves
  for insert to authenticated
  with check ((select public.is_space_member(space_id)) and added_by = (select auth.uid()));

create policy saves_member_update on public.saves
  for update to authenticated
  using ((select public.is_space_member(space_id)))
  with check ((select public.is_space_member(space_id)));

create policy saves_member_delete on public.saves
  for delete to authenticated
  using ((select public.is_space_member(space_id)));
