-- Dragon Tracker clan sync. Apply with the Supabase CLI or SQL editor.
-- The desktop app only receives the project's public URL and anon key.
-- Keep service-role keys and OAuth client secrets in Supabase secrets.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Tracker Member' check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clans (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 60),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clan_memberships (
  clan_id uuid not null references public.clans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'removed', 'left')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clan_id, user_id)
);

create index if not exists clan_memberships_user_active_idx
  on public.clan_memberships (user_id, status);

create table if not exists public.clan_invites (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans (id) on delete cascade,
  code_hash text not null unique,
  created_by uuid not null references auth.users (id) on delete restrict,
  expires_at timestamptz,
  max_uses integer not null default 1 check (max_uses between 1 and 1000),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists clan_invites_clan_idx on public.clan_invites (clan_id);

-- Only fields intentionally selected by a member belong in summary. Do not store
-- account passwords, Discord tokens, Steam cookies, email addresses, or backups.
create table if not exists public.shared_dragons (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans (id) on delete cascade,
  source_user_id uuid not null references auth.users (id) on delete cascade,
  source_local_id text not null check (char_length(source_local_id) between 1 and 160),
  summary jsonb not null default '{}'::jsonb check (octet_length(summary::text) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clan_id, source_user_id, source_local_id)
);

create index if not exists shared_dragons_clan_updated_idx
  on public.shared_dragons (clan_id, updated_at desc);

create table if not exists public.clan_map_pins (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans (id) on delete cascade,
  source_user_id uuid not null references auth.users (id) on delete cascade,
  source_local_id text not null check (char_length(source_local_id) between 1 and 160),
  label text not null check (char_length(trim(label)) between 1 and 80),
  pin_type text not null default 'Location' check (char_length(pin_type) between 1 and 40),
  x numeric(5, 2) not null check (x between 0 and 100),
  y numeric(5, 2) not null check (y between 0 and 100),
  notes text not null default '' check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clan_id, source_user_id, source_local_id)
);

create index if not exists clan_map_pins_clan_updated_idx
  on public.clan_map_pins (clan_id, updated_at desc);

-- Location sharing is separate from permanent map pins and expires automatically
-- from the user's view once expires_at has passed.
create table if not exists public.member_locations (
  clan_id uuid not null references public.clans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  x numeric(5, 2) not null check (x between 0 and 100),
  y numeric(5, 2) not null check (y between 0 and 100),
  precision text not null default 'approximate' check (precision in ('approximate', 'exact')),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (clan_id, user_id)
);

create table if not exists public.identity_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('steam')),
  external_id text not null check (char_length(external_id) between 1 and 80),
  linked_at timestamptz not null default now(),
  unique (provider, external_id),
  unique (user_id, provider)
);

-- Challenge and result data are never readable by normal clients. The Steam
-- callback edge function is the only component that uses this table.
create table if not exists public.identity_link_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('steam')),
  state_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.clan_audit_events (
  id bigint generated always as identity primary key,
  clan_id uuid not null references public.clans (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null check (char_length(action) between 1 and 80),
  subject_type text not null check (char_length(subject_type) between 1 and 80),
  subject_id text not null check (char_length(subject_id) between 1 and 160),
  created_at timestamptz not null default now()
);

create index if not exists clan_audit_events_clan_created_idx
  on public.clan_audit_events (clan_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists clans_updated_at on public.clans;
create trigger clans_updated_at before update on public.clans
for each row execute procedure public.set_updated_at();

drop trigger if exists clan_memberships_updated_at on public.clan_memberships;
create trigger clan_memberships_updated_at before update on public.clan_memberships
for each row execute procedure public.set_updated_at();

drop trigger if exists shared_dragons_updated_at on public.shared_dragons;
create trigger shared_dragons_updated_at before update on public.shared_dragons
for each row execute procedure public.set_updated_at();

drop trigger if exists clan_map_pins_updated_at on public.clan_map_pins;
create trigger clan_map_pins_updated_at before update on public.clan_map_pins
for each row execute procedure public.set_updated_at();

drop trigger if exists member_locations_updated_at on public.member_locations;
create trigger member_locations_updated_at before update on public.member_locations
for each row execute procedure public.set_updated_at();

create or replace function public.is_active_clan_member(target_clan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clan_memberships membership
    where membership.clan_id = target_clan_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.has_clan_role(target_clan_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clan_memberships membership
    where membership.clan_id = target_clan_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.create_clan(p_name text)
returns public.clans
language plpgsql
security definer
set search_path = public
as $$
declare
  new_clan public.clans;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 60 then
    raise exception 'Clan names must be between 2 and 60 characters';
  end if;

  insert into public.clans (name, created_by)
  values (trim(p_name), auth.uid())
  returning * into new_clan;

  insert into public.clan_memberships (clan_id, user_id, role)
  values (new_clan.id, auth.uid(), 'owner');

  insert into public.clan_audit_events (clan_id, actor_user_id, action, subject_type, subject_id)
  values (new_clan.id, auth.uid(), 'clan_created', 'clan', new_clan.id::text);

  return new_clan;
end;
$$;

create or replace function public.create_clan_invite(
  p_clan_id uuid,
  p_max_uses integer default 1,
  p_expires_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_code text;
  new_invite_id uuid;
begin
  if not public.has_clan_role(p_clan_id, array['owner', 'admin']) then
    raise exception 'Only clan owners and admins can create invites';
  end if;
  if p_max_uses not between 1 and 1000 then raise exception 'Invalid invite use count'; end if;
  if p_expires_at is not null and p_expires_at <= now() then raise exception 'Invite expiry must be in the future'; end if;

  -- A UUID is generated by PostgreSQL itself. Hashing this high-entropy, one-use
  -- code with md5 avoids depending on the pgcrypto extension schema.
  invite_code := upper(replace(gen_random_uuid()::text, '-', ''));
  insert into public.clan_invites (clan_id, code_hash, created_by, max_uses, expires_at)
  values (p_clan_id, md5(invite_code), auth.uid(), p_max_uses, p_expires_at)
  returning id into new_invite_id;

  insert into public.clan_audit_events (clan_id, actor_user_id, action, subject_type, subject_id)
  values (p_clan_id, auth.uid(), 'invite_created', 'invite', new_invite_id::text);

  return invite_code;
end;
$$;

create or replace function public.join_clan_with_invite(p_invite_code text)
returns public.clans
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.clan_invites;
  matched_clan public.clans;
  existing_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into invite
  from public.clan_invites
  where code_hash = md5(upper(trim(coalesce(p_invite_code, ''))))
  for update;

  if not found or invite.revoked_at is not null or (invite.expires_at is not null and invite.expires_at <= now()) or invite.use_count >= invite.max_uses then
    raise exception 'Invite is invalid or expired';
  end if;

  select status into existing_status
  from public.clan_memberships
  where clan_id = invite.clan_id and user_id = auth.uid();

  if existing_status = 'active' then
    select * into matched_clan from public.clans where id = invite.clan_id;
    return matched_clan;
  end if;

  insert into public.clan_memberships (clan_id, user_id, role, status)
  values (invite.clan_id, auth.uid(), 'member', 'active')
  on conflict (clan_id, user_id) do update
    set status = 'active', role = case when public.clan_memberships.role = 'owner' then 'owner' else 'member' end;

  update public.clan_invites set use_count = use_count + 1 where id = invite.id;
  select * into matched_clan from public.clans where id = invite.clan_id;

  insert into public.clan_audit_events (clan_id, actor_user_id, action, subject_type, subject_id)
  values (invite.clan_id, auth.uid(), 'invite_redeemed', 'membership', auth.uid()::text);

  return matched_clan;
end;
$$;

create or replace function public.leave_clan(p_clan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  select role into current_role
  from public.clan_memberships
  where clan_id = p_clan_id and user_id = auth.uid() and status = 'active';

  if current_role is null then raise exception 'You are not an active clan member'; end if;
  if current_role = 'owner' then raise exception 'Transfer ownership before leaving this clan'; end if;

  update public.clan_memberships
  set status = 'left'
  where clan_id = p_clan_id and user_id = auth.uid();

  delete from public.member_locations where clan_id = p_clan_id and user_id = auth.uid();
  insert into public.clan_audit_events (clan_id, actor_user_id, action, subject_type, subject_id)
  values (p_clan_id, auth.uid(), 'member_left', 'membership', auth.uid()::text);
end;
$$;

create or replace function public.list_clan_members(p_clan_id uuid)
returns table (
  user_id uuid,
  display_name text,
  role text,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_clan_member(p_clan_id) then
    raise exception 'You are not an active member of this clan';
  end if;

  return query
  select membership.user_id, coalesce(profile.display_name, 'Tracker Member'), membership.role, membership.joined_at
  from public.clan_memberships membership
  left join public.profiles profile on profile.id = membership.user_id
  where membership.clan_id = p_clan_id and membership.status = 'active'
  order by case membership.role when 'owner' then 0 when 'admin' then 1 when 'member' then 2 else 3 end, profile.display_name;
end;
$$;

create or replace function public.set_clan_member_role(p_clan_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_clan_role(p_clan_id, array['owner']) then
    raise exception 'Only a clan owner can change roles';
  end if;
  if p_role not in ('admin', 'member', 'viewer') then raise exception 'Invalid role'; end if;
  update public.clan_memberships
  set role = p_role
  where clan_id = p_clan_id and user_id = p_user_id and status = 'active' and role <> 'owner';
end;
$$;

create or replace function public.transfer_clan_ownership(p_clan_id uuid, p_new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_clan_role(p_clan_id, array['owner']) then
    raise exception 'Only the clan owner can transfer ownership';
  end if;
  if p_new_owner_id = auth.uid() then raise exception 'Choose another active member'; end if;
  if not exists (
    select 1 from public.clan_memberships
    where clan_id = p_clan_id and user_id = p_new_owner_id and status = 'active'
  ) then raise exception 'The new owner must be an active clan member'; end if;

  update public.clan_memberships
  set role = 'admin'
  where clan_id = p_clan_id and user_id = auth.uid();
  update public.clan_memberships
  set role = 'owner'
  where clan_id = p_clan_id and user_id = p_new_owner_id;
  update public.clans set created_by = p_new_owner_id where id = p_clan_id;

  insert into public.clan_audit_events (clan_id, actor_user_id, action, subject_type, subject_id)
  values (p_clan_id, auth.uid(), 'ownership_transferred', 'membership', p_new_owner_id::text);
end;
$$;

alter table public.profiles enable row level security;
alter table public.clans enable row level security;
alter table public.clan_memberships enable row level security;
alter table public.clan_invites enable row level security;
alter table public.shared_dragons enable row level security;
alter table public.clan_map_pins enable row level security;
alter table public.member_locations enable row level security;
alter table public.identity_links enable row level security;
alter table public.identity_link_challenges enable row level security;
alter table public.clan_audit_events enable row level security;

create policy "profiles are readable by their owner" on public.profiles
for select using (id = auth.uid());
create policy "profiles are created by their owner" on public.profiles
for insert with check (id = auth.uid());
create policy "profiles are updated by their owner" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

create policy "clans are visible to active members" on public.clans
for select using (public.is_active_clan_member(id));

create policy "memberships are visible only to their owner" on public.clan_memberships
for select using (user_id = auth.uid());

create policy "invites are visible to clan admins" on public.clan_invites
for select using (public.has_clan_role(clan_id, array['owner', 'admin']));

create policy "active members can read shared dragons" on public.shared_dragons
for select using (public.is_active_clan_member(clan_id));
create policy "members can share their own dragons" on public.shared_dragons
for insert with check (source_user_id = auth.uid() and public.is_active_clan_member(clan_id));
create policy "owners can update their shared dragons" on public.shared_dragons
for update using (source_user_id = auth.uid() and public.is_active_clan_member(clan_id))
with check (source_user_id = auth.uid() and public.is_active_clan_member(clan_id));
create policy "owners and admins can remove shared dragons" on public.shared_dragons
for delete using (source_user_id = auth.uid() or public.has_clan_role(clan_id, array['owner', 'admin']));

create policy "active members can read clan map pins" on public.clan_map_pins
for select using (public.is_active_clan_member(clan_id));
create policy "members can share their own map pins" on public.clan_map_pins
for insert with check (source_user_id = auth.uid() and public.is_active_clan_member(clan_id));
create policy "owners can update their clan map pins" on public.clan_map_pins
for update using (source_user_id = auth.uid() and public.is_active_clan_member(clan_id))
with check (source_user_id = auth.uid() and public.is_active_clan_member(clan_id));
create policy "owners and admins can remove clan map pins" on public.clan_map_pins
for delete using (source_user_id = auth.uid() or public.has_clan_role(clan_id, array['owner', 'admin']));

create policy "active members can read non-expired locations" on public.member_locations
for select using (public.is_active_clan_member(clan_id) and expires_at > now());
create policy "members can publish their own temporary location" on public.member_locations
for insert with check (user_id = auth.uid() and public.is_active_clan_member(clan_id) and expires_at > now());
create policy "members can update their own temporary location" on public.member_locations
for update using (user_id = auth.uid() and public.is_active_clan_member(clan_id))
with check (user_id = auth.uid() and public.is_active_clan_member(clan_id) and expires_at > now());
create policy "members can remove their own temporary location" on public.member_locations
for delete using (user_id = auth.uid());

create policy "identity links are private" on public.identity_links
for select using (user_id = auth.uid());

create policy "clan owners and admins can read audit events" on public.clan_audit_events
for select using (public.has_clan_role(clan_id, array['owner', 'admin']));

-- The service role used by the Steam callback bypasses RLS. No normal client has
-- policies for challenge rows, so their state values cannot be enumerated.

grant execute on function public.create_clan(text) to authenticated;
grant execute on function public.create_clan_invite(uuid, integer, timestamptz) to authenticated;
grant execute on function public.join_clan_with_invite(text) to authenticated;
grant execute on function public.leave_clan(uuid) to authenticated;
grant execute on function public.list_clan_members(uuid) to authenticated;
grant execute on function public.set_clan_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.transfer_clan_ownership(uuid, uuid) to authenticated;

alter table public.shared_dragons replica identity full;
alter table public.clan_map_pins replica identity full;
alter table public.member_locations replica identity full;
alter publication supabase_realtime add table public.shared_dragons, public.clan_map_pins, public.member_locations;
