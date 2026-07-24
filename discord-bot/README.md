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

## Keeping the bot online on Windows

The `Dragon Tracker Discord Bot` Scheduled Task runs `src/index.js` directly with Node in the background after you sign in. It has no visible terminal to close, and Windows restarts it after a failure. `run-discord-bot.ps1` is available only as a manual troubleshooting runner. Do not start or keep a separate `npm start` terminal open; it can create a second bot connection with the same token.

## Commands

- `/dt-dragon` submits a dragon to the tracker inbox.
- `/dt-createdragon` submits a dragon using the breeder-friendly command name. Its optional `Nest role` is a Dragon Tracker setting, not a Discord server role. The Discord server's `Breeder` role controls who can submit dragons; successful submissions are posted publicly for clan members to view.
- `/dt-eggrequest` posts an egg request in the channel for breeders and saves it to the tracker inbox.
- `/dt-alerts` lets a user opt in or out of private DMs when their bot-submitted dragons match a later egg request. Alerts are off by default.
- `/dt-upstat` submits skin upstat progress.
- `/dt-broodpouch` submits an egg stored in a brood pouch or brood vault.
- `/dt-currentnest` submits a current nest note.
- `/dt-location` submits a map pin to the tracker inbox.
- `/dt-note` submits a note for review.
- `/dt-help` shows a short help message.

Prefix commands such as `!createdragon`, `!eggrequest`, `!upstat`, `!broodpouch`, `!broodvault`, and `!currentnest` are optional. To enable them, set `ENABLE_PREFIX_COMMANDS=true` and enable the Discord Message Content Intent for the bot. Slash commands are preferred because they need fewer Discord permissions.

## Egg-request match alert privacy

- Alerts are off until the dragon owner runs `/dt-alerts` with `Enabled`.
- The bot only checks dragons submitted through this bot for the same clan. It does not scan Discord messages, Steam accounts, or private local tracker data.
- A requester is never alerted about their own submitted dragons.
- One request produces at most one DM per matching dragon owner, even when several of their dragons match.
- The bot records only the minimum delivery state needed to prevent repeat alerts for the same request and dragon. It never stores Discord credentials, Steam credentials, or DM contents.
