# GTA 6 Notifier — PWA companion

The PWA now reads the central JSON files published by this repository:

- `data/history.json`
- `data/github-releases.json`
- `data/portwatch-progress.json`
- `data/portwatch-leaderboard.json`

It synchronizes immediately when opened and polls every 60 seconds while the page remains open. Device-local browser notifications can be enabled from the PWA.

## Important limitations

- GitHub Pages/static JSON is not a push server. Notifications are checked while the PWA page is open; delivery while the PWA is closed is **not** guaranteed.
- True Web Push while closed still requires a separately hosted HTTPS push endpoint and VAPID keys.
- GitHub Actions updates the central JSON files on a five-minute schedule, subject to GitHub Actions scheduling delays.
- The PWA reads the public repository data. Do not put secrets, webhook URLs, tokens, or private information in `data/`.

## Hosting

Enable GitHub Pages for the repository and publish the `main` branch root (or configure the existing Pages setup to publish `pwa/`). Open the PWA's published URL over HTTPS to install it.
