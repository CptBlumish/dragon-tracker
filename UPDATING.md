# Updating Dragon Tracker

Use this flow whenever you change the tracker and want users to receive an update.

## Release Checklist

1. Make code changes.
2. Run:

```bash
npm install
npm run check
npm run start
```

3. Test the important screens manually.
4. Bump the version in `package.json`.
5. Commit the change:

```bash
git add .
git commit -m "Release v1.0.1"
```

6. Tag and push:

```bash
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

GitHub Actions will build the release. Users with installed desktop builds can use Help > Check for Updates, and the app also checks shortly after startup.

Only the repository owner or approved collaborators should push release tags. Public repository visibility lets users reach update metadata; it does not give them permission to change code or publish releases.

## Data Safety

Dragon Tracker is local-first. App updates should not erase user data, but users should still export a JSON backup before major changes.

## If Update Checks Fail

Check these first:

- The GitHub release contains `latest.yml`, `latest-mac.yml`, or other generated updater metadata.
- `package.json` points at the correct GitHub owner and repo under `build.publish`.
- The new release version is higher than the installed app version.
- The release feed is publicly reachable. Desktop apps cannot use your private GitHub login to read private releases.
- The app was installed from a packaged build, not run with `npm run start`.
