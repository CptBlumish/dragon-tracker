# Dragon Tracker

Dragon Tracker is a local-first Day of Dragons tracker for dragons, players, accounts, skins, upstats, nesting, lineage, and map references.

The tracker can run as:

- A browser app by opening `index.html`
- A local web app with `Start Dragon Tracker Local.bat`
- A desktop app with Electron
- A GitHub Releases desktop app with installable builds and update checks

Your tracker data stays on your own machine. Use the app's Backup tab before major updates, before switching machines, or before sharing data with another player.

## What It Tracks

- Dragon records with player, account, species, sex, status, server, skin, recessive skin, lineage, bloodline quality, genetics stats, mutation points, elder progress, tags, and notes
- Players and accounts, including DLC toggles per account
- Skin codex grouped by species and rarity/type
- Upstat progress, including 18A+ tracking
- Nesting planner with species/sex validation, inbred nest warnings, skin odds, stat projection, and family tree display
- Map tab with locations, crystals, food maps, clickable area references, and share/import location pins
- PNG genetics screenshot import for stat letters and bloodline quality
- JSON backup/import and CSV export

## Desktop Development

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run start
```

Check syntax:

```bash
npm run check
```

Build installers for your current platform:

```bash
npm run build
```

Windows build:

```bash
npm run build:win
```

Outputs go into `dist/`.

## GitHub Releases And Updates

This repo is prepared for GitHub Actions. The workflow in `.github/workflows/release.yml` builds Windows, macOS, and Linux desktop releases when you push a version tag.

The repository is intended to be public for downloads and updater access, while write access stays restricted to the owner and approved collaborators. Public users can download releases and open issues, but they cannot push code or publish updates.

For first-time GitHub setup and future releases, read:

- `GITHUB_SETUP.md`
- `UPDATING.md`
- `DESKTOP.md`
- `SECURITY.md`

Packaged desktop builds include a Help > Check for Updates menu item. Update checks use the GitHub release metadata created by the release workflow.

## Important Notes

- Windows and macOS may show unsigned-app warnings until the app is code-signed.
- Do not commit `node_modules/` or `dist/`; they are intentionally ignored.
- Do not commit exported tracker backups, local databases, `.env` files, logs, API keys, or screenshots containing private player/account data.
- If your GitHub username or repo name is not `CptBlumish/dragon-tracker`, update the GitHub URLs in `package.json` before publishing releases.
