# Dragon Tracker

Dragon Tracker is a local-first Day of Dragons tracker for dragons, players, accounts, skins, upstats, nesting, lineage, and map references. Your tracker data stays on your own machine unless you export and share it.

## Download

Download the newest version from [GitHub Releases](https://github.com/CptBlumish/dragon-tracker/releases/latest).

- Windows users should download `Dragon-Tracker-Setup.exe`.
- macOS users should download the `.dmg` or `.zip`.
- Linux users should download the `.AppImage` or `.deb`.

The desktop app can check for updates from the Help menu. The current app version is shown on the Settings tab.

## What It Tracks

- Dragon records with player, account, species, sex, status, server, skin, recessive skin, lineage, bloodline quality, genetics stats, mutation points, elder progress, tags, and notes
- Players and accounts, including DLC toggles per account
- Skin codex grouped by species and rarity/type
- Upstat progress, including 18A+ tracking
- Nesting planner with species/sex validation, inbred nest warnings, skin odds, stat projection, and family tree display
- Map tab with locations, crystals, food maps, clickable area references, and share/import location pins
- Optional Clan Sync with Discord identity, SteamID64 verification, opt-in dragon and map-pin sharing, and role-based clan access
- PNG genetics screenshot import for stat letters and bloodline quality
- JSON backup/import and CSV export

## Backups

Use the Settings tab before switching machines, testing a new build, or sharing tracker data with someone else. Backup files can include player names, account names, Discord handles, Steam IDs, dragon lineage, and map pins.

Only share backup files with people you trust.

## Clan Sync

Clan Sync is optional and begins with no shared data. Connecting Discord establishes an identity for clan permissions; it does not grant access to Discord messages, servers, friend lists, or email. Steam linking verifies only a SteamID64 through Steam OpenID.

Only dragons and map pins that a member explicitly shares are visible to a clan. Local accounts, full backups, and unshared records remain on the device. Project owners can follow [Clan Sync Setup](docs/CLAN_SYNC_SETUP.md) to deploy the secure backend.

## Feedback

Use the [bug report](.github/ISSUE_TEMPLATE/bug_report.md) and [feature request](.github/ISSUE_TEMPLATE/feature_request.md) templates in the [Issues tab](https://github.com/CptBlumish/dragon-tracker/issues). Do not attach private backups or screenshots with personal account details to public issues.

## Important Notes

- Windows and macOS may show unsigned-app warnings until the app is code-signed.
- Public users can download releases and open issues, but they cannot push code or publish updates.
