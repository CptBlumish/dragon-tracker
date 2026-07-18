# Discord Bot Link

Dragon Tracker can receive clan submissions from a Discord bot. The bot does not directly edit a user's local tracker. It sends sanitized records to Supabase, then clan members import or ignore them from **Clans > Discord Inbox**.

## Architecture

1. Discord slash command collects a dragon, map pin, or note.
2. The bot sends the submission to `supabase/functions/discord-bot-ingest`.
3. The Edge Function checks `DRAGON_TRACKER_BOT_INGEST_SECRET`.
4. Supabase stores the record in `discord_bot_submissions`.
5. Dragon Tracker users signed into the matching clan can import or ignore the pending item.

## Required Setup

Run this SQL in Supabase:

```text
supabase/migrations/0004_discord_bot_submissions.sql
```

Deploy this Edge Function:

```text
supabase/functions/discord-bot-ingest
```

Set this Supabase function secret:

```text
DRAGON_TRACKER_BOT_INGEST_SECRET
```

Create the bot `.env` from:

```text
discord-bot/.env.example
```

The same `DRAGON_TRACKER_BOT_INGEST_SECRET` must be used in Supabase and the bot `.env`.

## Bot Commands

- `/dt-dragon`
- `/dt-location`
- `/dt-note`
- `/dt-help`

## Security Rules

- Never commit `.env`.
- Never put the Supabase service-role key in the bot.
- Never put Discord bot tokens in Dragon Tracker.
- Do not use this bot to collect Steam passwords, Discord passwords, or account passwords.
