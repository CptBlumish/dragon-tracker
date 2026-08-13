DRAGON TRACKER - BROWSER EDITION

This edition runs Dragon Tracker in your normal web browser and does not install
Electron, add shortcuts, or modify system files.

WINDOWS
1. Extract the entire ZIP.
2. Double-click "Start Dragon Tracker.bat".
3. Keep the local server running while the tracker is open.

MACOS OR LINUX
1. Extract the entire ZIP.
2. Open a terminal in the extracted folder.
3. Run: chmod +x start-dragon-tracker.sh
4. Run: ./start-dragon-tracker.sh
5. Keep the terminal open while the tracker is in use.

Python 3 is required by the local browser launcher. If Python 3 is unavailable,
you can open index.html directly for offline tracking, but Discord and clan sign-in
will not work from a file:// address.

YOUR DATA
- Data is saved in the selected browser profile for http://127.0.0.1:8765.
- Use the Settings tab to create regular JSON backups.
- Clearing browser site data or using a private window can remove local records.
- Keep using the same address and port so your saved browser data remains available.
- To update, download the newer browser ZIP, extract it, and launch it the same way.

CLAN SYNC
- Clan Sync is supported when this edition is opened with its included launcher.
- Use the same Sync address, public Connection key, Discord identity, and clan
  invite code as members using the installed desktop app.
- The clan organizer must allow the matching Discord return address in Supabase:
  Windows: http://localhost:8765/index.html
  macOS/Linux: http://127.0.0.1:8765/index.html
- If you change the launcher's port, the organizer must allow that exact address.
- Clan sign-in cannot work when index.html is opened from a file:// address.

PRIVACY
Dragon Tracker is local-first. Nothing is shared unless you explicitly use a clan
sharing feature. Never share a backup with someone you do not trust.
