# Dragon Tracker Discord Bot

This is an optional companion bot. It lets clan members submit dragon records, egg requests, upstat progress, brood pouch eggs, current nests, and map pins from Discord, then Dragon Tracker users can import or review those submissions from the Clans tab.

## What it does not store

- No Steam passwords.
- No Discord passwords.
- No Discord message history.
- No Supabase service-role key.

The bot sends submissions to the `discord-bot-ingest` Supabase Edge Function using `DRAGON_TRACKER_BOT_INGEST_SECRET`.

## Setup

1. Create a Discord application and bot in the Discord Developer Portal.
2. Copy `.env.example` to `.env`.
3. Fill in:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID`
   - `SUPABASE_URL`
   - `DRAGON_TRACKER_CLAN_ID`
   - `DRAGON_TRACKER_BOT_INGEST_SECRET`
4. In Supabase, run `supabase/migrations/0004_discord_bot_submissions.sql` and `supabase/migrations/0005_breeder_bot_submissions.sql`.
5. Deploy the `discord-bot-ingest` Edge Function.
6. Set the same `DRAGON_TRACKER_BOT_INGEST_SECRET` as a Supabase function secret.
7. Run:

```powershell
npm install
npm run deploy
npm start
```

## Commands

- `/dt-dragon` submits a dragon to the tracker inbox.
- `/dt-createdragon` submits a dragon using the breeder-friendly command name. Its optional `Nest role` is a Dragon Tracker setting, not a Discord server role. The Discord server's `Breeder` role controls who can submit dragons; successful submissions are posted publicly for clan members to view.
- `/dt-eggrequest` posts an egg request in the channel for breeders and saves it to the tracker inbox.
- `/dt-upstat` submits skin upstat progress.
- `/dt-broodpouch` submits an egg stored in a brood pouch or brood vault.
- `/dt-currentnest` submits a current nest note.
- `/dt-location` submits a map pin to the tracker inbox.
- `/dt-note` submits a note for review.
- `/dt-help` shows a short help message.

Prefix commands such as `!createdragon`, `!eggrequest`, `!upstat`, `!broodpouch`, `!broodvault`, and `!currentnest` are optional. To enable them, set `ENABLE_PREFIX_COMMANDS=true` and enable the Discord Message Content Intent for the bot. Slash commands are preferred because they need fewer Discord permissions.
