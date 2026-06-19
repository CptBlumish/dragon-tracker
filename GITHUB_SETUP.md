# GitHub Setup

This folder is ready to become the `dragon-tracker` GitHub repository.

## Create The Repository

From this folder:

```bash
git init
git add .
git commit -m "Initial Dragon Tracker desktop app"
```

Create a GitHub repo named `dragon-tracker`.

If you use GitHub CLI:

```bash
gh repo create dragon-tracker --public --source=. --remote=origin --push
```

If you create it in the browser instead:

```bash
git remote add origin https://github.com/CptBlumish/dragon-tracker.git
git branch -M main
git push -u origin main
```

If your GitHub username or repo name is different, update these fields in `package.json` before the first release:

- `homepage`
- `repository.url`
- `bugs.url`
- `build.publish.owner`
- `build.publish.repo`

## First Release

Make sure `package.json` has the version you want, such as `1.0.0`.

Create and push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will run `.github/workflows/release.yml`, build the installers, and attach them to the GitHub Release.

## What Users Download

Windows users should usually download:

- `Dragon-Tracker-Setup.exe`

Alternate Windows option:

- `Dragon Tracker.zip`

macOS users download:

- `.dmg`

Linux users download:

- `.AppImage` or `.deb`

The `.yml` and `.blockmap` files are for automatic updates. Keep them attached to releases.
