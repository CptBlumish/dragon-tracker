-- Repair invite functions for Supabase projects where pgcrypto lives outside
-- the function search path. Invite codes remain one-use and high entropy.

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
