-- Discord bot submissions for Dragon Tracker.
-- The bot writes through the discord-bot-ingest Edge Function. Tracker clients
-- only read and resolve pending records for clans they actively belong to.

create table if not exists public.discord_bot_submissions (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans (id) on delete cascade,
  source_key text not null check (char_length(source_key) between 1 and 160),
  discord_guild_id text not null default '' check (char_length(discord_guild_id) <= 40),
  discord_channel_id text not null default '' check (char_length(discord_channel_id) <= 40),
  discord_user_id text not null default '' check (char_length(discord_user_id) <= 40),
  discord_username text not null default 'Discord user' check (char_length(discord_username) between 1 and 100),
  submission_type text not null check (submission_type in ('dragon', 'map_pin', 'note')),
  payload jsonb not null default '{}'::jsonb check (octet_length(payload::text) <= 8192),
  status text not null default 'pending' check (status in ('pending', 'imported', 'ignored')),
  imported_by uuid references auth.users (id) on delete set null,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clan_id, source_key)
);

create index if not exists discord_bot_submissions_clan_status_idx
  on public.discord_bot_submissions (clan_id, status, created_at desc);

drop trigger if exists discord_bot_submissions_updated_at on public.discord_bot_submissions;
create trigger discord_bot_submissions_updated_at before update on public.discord_bot_submissions
for each row execute procedure public.set_updated_at();

alter table public.discord_bot_submissions enable row level security;

create policy "active members can read discord bot submissions" on public.discord_bot_submissions
for select using (public.is_active_clan_member(clan_id));

create or replace function public.resolve_discord_bot_submission(
  p_submission_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  submission public.discord_bot_submissions;
begin
  if p_status not in ('imported', 'ignored') then
    raise exception 'Unsupported submission status';
  end if;

  select * into submission
  from public.discord_bot_submissions
  where id = p_submission_id;

  if submission.id is null then
    raise exception 'Discord submission was not found';
  end if;

  if not public.is_active_clan_member(submission.clan_id) then
    raise exception 'You are not an active member of this clan';
  end if;

  update public.discord_bot_submissions
  set status = p_status,
      imported_by = auth.uid(),
      imported_at = now()
  where id = p_submission_id;
end;
$$;

grant execute on function public.resolve_discord_bot_submission(uuid, text) to authenticated;

alter publication supabase_realtime add table public.discord_bot_submissions;
