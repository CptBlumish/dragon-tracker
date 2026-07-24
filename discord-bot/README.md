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
7. Install dependencies and register the Discord commands:

```powershell
npm install
npm run deploy
./install-discord-bot-task.ps1
```

## Keeping the bot online on Windows

`install-discord-bot-task.ps1` creates or refreshes the `Dragon Tracker Discord Bot` Scheduled Task. It starts Node through a hidden Windows Script Host runner after sign-in and asks Windows to restart it after a failure. Do not start or keep a separate `npm start` terminal open; it can create a second bot connection with the same token.

The task writes service-only diagnostics to `%LOCALAPPDATA%\Dragon Tracker\discord-bot.log`. The current log rotates once it reaches 2 MB, so ordinary command traffic does not leave an unbounded file behind.

## Automated test bank

For command testing, the test-bank tool submits every valid visible/recessive skin pair for all seven species. It rotates sex, status, nest role, and bloodline values, then adds one upstat record for every species/skin plus brood-pouch and current-nest samples. Records are clearly labeled `[TEST]` and remain in the clan's Discord inbox until they are ignored or imported.

Run it from `discord-bot` with a Discord user id that should own the test records:

```powershell
npm run seed:test-data -- --user-id YOUR_DISCORD_USER_ID
```

The matching owner must use `/dt-alerts` with `Enabled` before testing egg-request DMs. To remove only records created by this tool later:

```powershell
npm run clear:test-data
```

## Commands

- `/dt` opens the Dragon Tracker dashboard. Its buttons cover dragon submissions, egg requests, clan dragon search, upstat progress, brood pouches, current nests, map pins, private nesting alerts, and help.
- Buttons open short forms in Discord, so users do not need to remember separate command names or argument order.
- Dragon submission still requires the Discord server's `Breeder` role. A dragon's optional `Nest role` is a Dragon Tracker setting and is separate from that Discord role.

Prefix commands such as `!createdragon`, `!eggrequest`, `!upstat`, `!broodpouch`, `!broodvault`, and `!currentnest` remain optional for compatibility. To enable them, set `ENABLE_PREFIX_COMMANDS=true` and enable the Discord Message Content Intent for the bot. The `/dt` dashboard is preferred because it needs fewer Discord permissions and is easier to navigate.

## Egg-request match alert privacy

- Alerts are off until the dragon owner opens `/dt`, selects `Nesting Alerts`, and enables them.
- The bot only checks dragons submitted through this bot for the same clan. It does not scan Discord messages, Steam accounts, or private local tracker data.
- Dragon search includes records deliberately shared to the clan from the app and bot-submitted dragons waiting in the clan inbox. The bot accepts commands only in its configured Discord server.
- An opted-in owner can be alerted about their own request when their submitted dragon matches, which is useful for testing and request confirmation.
- Matching requests are collected into one recipient-specific digest for the configured digest window, which defaults to one minute. Each digest summarizes several requests and matching dragons instead of sending one DM per match.
- The bot records only the minimum delivery state needed to prevent repeat alerts for the same request and dragon. It never stores Discord credentials, Steam credentials, or DM contents.
