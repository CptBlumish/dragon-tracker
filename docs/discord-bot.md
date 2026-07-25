# Discord Bot Link

Dragon Tracker can receive clan submissions from a Discord bot. The bot sends sanitized records to Supabase. A submission enters local Players and Dragons only when its Discord user ID matches the Discord account connected to that tracker; everyone else sees it only in **Clans > Discord Inbox** or the shared Clan Library.

## Architecture

1. Discord slash command collects a dragon, egg request, upstat record, brood pouch egg, current nest, map pin, or note.
2. The bot sends the submission to `supabase/functions/discord-bot-ingest`.
3. The Edge Function checks `DRAGON_TRACKER_BOT_INGEST_SECRET`.
4. Supabase stores the record in `discord_bot_submissions`.
5. Dragon Tracker compares the submitter's immutable Discord user ID with the connected tracker identity.
6. Matching submissions import into that user's local tracker. Other clan members receive a read-only Clan Library view and cannot import or ignore someone else's record.

## Required Setup

Run this SQL in Supabase:

```text
supabase/migrations/0004_discord_bot_submissions.sql
supabase/migrations/0005_breeder_bot_submissions.sql
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
- `/dt-createdragon`
- `/dt-eggrequest`
- `/dt-upstat`
- `/dt-broodpouch`
- `/dt-currentnest`
- `/dt-location`
- `/dt-note`
- `/dt-help`

Optional prefix aliases are available for servers that prefer typed commands: `!createdragon`, `!eggrequest`, `!upstat`, `!broodpouch`, `!broodvault`, and `!currentnest`. Keep `ENABLE_PREFIX_COMMANDS=false` unless you also enable Discord's Message Content Intent for the bot.

## Security Rules

- Never commit `.env`.
- Never put the Supabase service-role key in the bot.
- Never put Discord bot tokens in Dragon Tracker.
- Do not use this bot to collect Steam passwords, Discord passwords, or account passwords.
- Never use a display name, player alias, or account name to decide who owns a Discord submission.
