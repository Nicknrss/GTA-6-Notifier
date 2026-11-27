# GTA 6 Notifier — repository layout

- `extension/chromium/`: Chromium/Brave/Chrome extension (Manifest V3).
- `extension/firefox/`: Firefox variant, with its Firefox manifest named `manifest.json`.
- `pwa/`: installable PWA companion.
- `README.md`: project overview from the v2.2.0 package.

The application files were copied from the supplied v2.2.0 archive. No monitoring logic,
branding assets, translations, or application code were intentionally modified.
The separate PWA companion archive was not duplicated because its eight files match
the `pwa/` directory inside the main v2.2.0 archive byte-for-byte.
