# Security Policy

Dragon Tracker is local-first. Dragon records, players, accounts, map pins, and backups are stored on the user's own machine unless the user exports and shares a backup file.

## Reporting A Problem

Please report security issues privately to the repository owner instead of opening a public issue. Include:

- What happened
- Steps to reproduce it
- Whether local tracker data, exported backups, or update downloads were involved

## Update Safety

Desktop updates are delivered through GitHub Releases. Release assets should never include:

- `.env` files
- API keys or OAuth secrets
- Local backup exports
- Local databases or logs
- User screenshots containing private account details

## User Data

Backups can contain player names, account names, Discord handles, Steam IDs, dragon lineage, and map pins. Only share backup files with people you trust.

