# Security Policy

Dragon Tracker is local-first. Dragon records, players, accounts, map pins, and backups are stored on the user's own machine unless the user exports and shares a backup file.

## Optional Clan Sync

Clan Sync is opt-in. Discord is used only to establish a tracker identity, and Steam linking uses Steam OpenID to verify a SteamID64. The app does not request Discord email, guild, message, or friend-list access, and it never reads Steam passwords, cookies, client files, or account-switching data.

Only explicitly shared dragons and map pins are sent to the clan backend. Backups, account credentials, OAuth client secrets, service-role keys, browser cookies, and unshared tracker records must never be uploaded or committed. Desktop sign-in sessions are stored with operating-system encrypted storage when available.

The clan backend relies on Supabase Row Level Security. Treat the policies in `supabase/migrations/0001_clan_sync.sql` as a release gate: test with separate accounts before inviting users, and keep service-role keys and Discord client secrets in Supabase secrets only.

## Reporting A Problem

Report security or privacy issues privately to the repository owner instead of opening a public issue. Include:

- What happened
- Steps to reproduce it
- Whether local tracker data, exported backups, screenshots, or update downloads were involved

## Backup Safety

Backups can contain player names, account names, Discord handles, Steam IDs, dragon lineage, and map pins. Only share backup files with people you trust.

Do not post backup files or screenshots with private account details in public issues.
