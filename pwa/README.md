# GTA 6 Notifier — PWA companion

This folder contains an installable, offline-capable PWA shell for the mobile companion.

## Important: cloud backend is required

The browser extension stores monitoring state locally. A PWA on a phone cannot directly read the extension's storage, and browser CORS rules prevent the PWA from simply reusing the extension's privileged GitHub requests. Reliable push while the PWA is closed also requires a push server and VAPID credentials.

For that reason, this PWA expects a separately deployed HTTPS API. The UI supports:

- `GET /api/state` — returns `{ "releasesDetected": 0, "portwatch": { "leaderScore": 0, "leaderName": "" }, "events": [{ "title": "", "message": "", "url": "", "timestamp": 0 }] }`.
- `POST /api/push/subscribe` — accepts a standard Web Push `PushSubscription` JSON body and stores it for future notifications.
- Web Push messages should be JSON `{ "title": "...", "body": "...", "url": "https://..." }`.

The PWA can be hosted on GitHub Pages or another HTTPS static host after the API endpoint and VAPID public key are configured in the app. No cloud API is included or deployed in this package, so cross-device sync and background push are not active yet. The extension's local monitoring, dashboard, history, charts, diagnostics and notification settings work independently.

## Local preview

Serve this folder over localhost (not `file://`) to test service-worker registration and installation. Push requires HTTPS (localhost is treated as secure by modern browsers).
