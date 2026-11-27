# GTA 6 Notifier — repository layout

- `extension/chromium/`: Chromium/Brave/Chrome extension (Manifest V3).
- `extension/firefox/`: Firefox variant, with its Firefox manifest named `manifest.json`.
- `pwa/`: installable PWA companion.
- All application icons use the supplied GN logo.
- `README.md`: project overview from the v2.2.0 package.

The application logic is copied from the supplied v2.2.0 archive. The supplied GN artwork
replaces the previous project icon in the extension, dashboard and PWA. The checkerboard
outside the circular emblem was made transparent for clean app-icon rendering.


Branding: all extension and PWA icon files use the corrected GN logo supplied by the project owner. The original 1024x1024 PNG is preserved at `assets/GN-logo.png`.


## Central backend additions
- `.github/workflows/central-monitor.yml`: scheduled five-minute GitHub Actions workflow.
- `scripts/monitor.py`: central GitHub Releases and PortWatch collector.
- `data/*.json`: shared event, release, progress and leaderboard history.
