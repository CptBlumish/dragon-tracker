# Clan Sync Setup

Clan Sync is optional. Until a user configures it and chooses to share an item, Dragon Tracker remains local-only.

## What You Need

- A Supabase project owned by a trusted clan organizer
- A Discord application owned by that organizer
- The Supabase CLI installed and logged in for the organizer setup only
- Either a packaged Dragon Tracker build or a local tracker opened through `http://localhost` or `http://127.0.0.1`

Never put a Supabase service-role key, Discord client secret, Steam API key, browser cookie, password, or backup file into the desktop app or this repository.

## 1. Create the Database

From the repository root, link the Supabase project and apply the migration:

```powershell
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration in `supabase/migrations/0001_clan_sync.sql` creates clan tables, opt-in shared dragon and pin tables, Steam identity link tables, Row Level Security policies, and role-checked RPC functions.

## 2. Configure Discord Identity

1. Create an application in the Discord Developer Portal.
2. Add this redirect URL in Discord, replacing the project reference:

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

3. In Supabase Authentication, enable the Discord provider and enter the Discord client ID and client secret.
4. Request only the `identify` scope. Do not enable email, guild, member, message, or presence scopes.
5. In Supabase Authentication, add these exact allowed redirect addresses:

   ```text
   dragontracker://auth/callback
   ```

   Add the exact local address used by browser-local members as well. For the included local server, add one or both of:

   ```text
   http://127.0.0.1:8765/index.html
   http://localhost:8765/index.html
   ```

   Do not use a wildcard redirect. If a local member uses another port, add that exact address before they connect Discord.

The app uses Discord only to create a sign-in identity for clan permissions. It does not read Discord messages, servers, friend lists, or email.

## 3. Deploy Steam OpenID Linking

Steam linking verifies a SteamID64 through Steam OpenID. It does not use Steam passwords, cookies, local Steam files, or a Steam Web API key. The callback returns to the installed app or, for the included local server, to the exact `localhost` or `127.0.0.1` tracker page that began the link.

Set the callback target, then deploy the function:

```powershell
supabase secrets set DRAGON_TRACKER_DEEP_LINK=dragontracker://auth/callback
supabase functions deploy steam-openid --no-verify-jwt
```

The function validates the Steam OpenID assertion server-side and stores only the SteamID64 in `identity_links`. Steam link state is hashed, short-lived, and single-use.

## 4. Configure Dragon Tracker

In the app, open **Settings** and select **Connect Sync**. Enter only:

- Your project URL, for example `https://YOUR_PROJECT_REF.supabase.co`, in **Sync address**
- The public anon or publishable key from Supabase Settings > API, in **Connection key**

The anon or publishable key is designed to be public. It grants no access beyond the Row Level Security rules in the migration. The packaged desktop app stores its sign-in session using the operating system's encrypted credential storage. Browser-local use keeps the sign-in session for that browser session.

After saving the connection, open **Clans** and select **Connect Discord**. The tracker opens Discord in the system browser. After approval, Discord returns the user to the desktop app or local browser tracker. Every member then uses a one-use invite code to join the correct clan.

## 5. Verify Before Inviting Anyone

Use two Discord accounts and confirm all of the following:

1. A signed-in user with no clan sees no clan records.
2. A member can view only the clan they joined.
3. A member cannot read or edit another clan's shared dragons or pins.
4. A member can share only their own local dragon or pin.
5. A regular member cannot create an invite or change a role.
6. A clan owner cannot leave until ownership is transferred.
7. An expired or already-used invite cannot be redeemed.
8. Steam linking shows only that it is linked, not the SteamID64 in the app interface.
9. A packaged app and a browser-local tracker can both connect Discord, redeem the same invite, and view a deliberately shared test dragon.

## Sharing Rules

- New dragons, accounts, backups, lineage, and pins begin local-only.
- A dragon is shared only after its owner presses **Share to Clan** and confirms.
- A local map pin is shared only after its owner presses **Share to Clan** and confirms.
- Removing a shared item from the clan does not delete the owner's local record.
- Clan map pins are read-only copies in another member's tracker. They are never silently imported into local data.

## Optional Discord Bot Intake

The normal **Share to Clan** button does not require a Discord bot. A bot is optional and should be treated as a server-side integration, not part of the desktop app.

1. Create a separate Discord application and bot for the clan. Install it only in the clan server, using only the permissions required for slash commands. Do not grant Administrator.
2. Create a command such as `/dragon submit` that gathers a display name, species, skin, recessive skin, stage, and optional public note.
3. Register a Supabase Edge Function as the Discord Interactions Endpoint. The function must verify Discord's `X-Signature-Ed25519` and `X-Signature-Timestamp` headers before handling every request.
4. Store `DISCORD_BOT_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_PUBLIC_KEY`, and any Supabase service-role credential as Supabase secrets. Do not place them in Dragon Tracker, a backup, GitHub source, or a Discord message.
5. Insert bot submissions as pending shared-dragon proposals. A clan owner or admin should approve a submission before it becomes visible to the clan. Never use a bot submission to overwrite someone else's local dragon or store account details, credentials, private notes, or backup data.

Build and deploy this bot endpoint only after adding a server-side review flow. It is intentionally not enabled by the standard clan-sync configuration.

## Release Checklist

- Keep the GitHub repository private for source control or protect the default branch and release workflow.
- Keep Supabase service-role and Discord client-secret values in Supabase or GitHub Actions secrets only.
- Review RLS policies after every schema change.
- Test the packaged app's `dragontracker://` callback before release.
- Publish a release only after the migration and Edge Function version are deployed to the production Supabase project.
