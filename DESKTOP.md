# Dragon Tracker Desktop App

Dragon Tracker is packaged with Electron. The desktop wrapper opens the same tracker UI from `index.html`, `styles.css`, and `app.js`.

## Commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run start
```

Check syntax:

```bash
npm run check
```

Create an unpacked app folder:

```bash
npm run pack
```

Build installers:

```bash
npm run build
```

Build by platform:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## Windows Outputs

`npm run build:win` creates:

- `dist/Dragon-Tracker-Setup.exe` - normal installer with desktop and Start Menu shortcuts
- `dist/Dragon Tracker.exe` - portable app
- `dist/Dragon Tracker.zip` - folder app with an installer batch file
- `dist/latest.yml` and `.blockmap` files - updater metadata

The folder app is useful if Windows dislikes the portable exe:

1. Extract `dist/Dragon Tracker.zip`.
2. Double-click `Install Dragon Tracker.bat`.
3. Launch Dragon Tracker from the desktop shortcut.

## Auto Updates

Packaged builds include Help > Check for Updates.

Updates work when:

1. `package.json` has the correct GitHub `build.publish.owner` and `build.publish.repo`.
2. You publish releases through `.github/workflows/release.yml`.
3. The release contains the generated `.yml` and `.blockmap` updater files.

The app checks for updates shortly after startup and can also check manually from the Help menu.

Local browser data and desktop app data are separate. Use Backup/Import to move data from a browser copy into the desktop app.

## Code Signing

Unsigned builds are usable, but Windows SmartScreen and macOS Gatekeeper can warn users. For public distribution, add code signing later:

- Windows: Authenticode certificate
- macOS: Apple Developer ID certificate and notarization
