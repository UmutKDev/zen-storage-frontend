# Zen Storage — app UI kit

Interactive recreation of the v2 web app (`UmutKDev/nextjs-storage@v2`), composed from the design-system components (`window.ZenStorageDesignSystem_33e1f8`).

Open `index.html`:

- **Login** — AuthCard on solid surface (auth forms are never glass), demo credentials prefilled; "Sign in" enters the app.
- **Storage browser** — glass-chrome topbar + sidebar over solid content; breadcrumb deep-linking, list/grid toggle, hover checkboxes, multi-select with floating bulk bar, encrypted/hidden folder states, usage bar.
- **Preview modal** — glass-overlay file preview shell.
- **Command palette** — ⌘K / Ctrl-K glass-overlay palette.
- **Account · Security** — solid cards for password / 2FA / sessions.
- **Theme toggle** — light/dark class-based theming in the topbar.

Files: `app.jsx` (state + routing), `AppChrome.jsx` (sidebar/topbar shell), `LoginScreen.jsx`, `StorageScreen.jsx`, `PreviewModal.jsx`, `CommandPalette.jsx`, `AccountScreen.jsx`, `data.js` (fake folder tree).

Faithful to the repo; functionality is mocked (no backend). Anything not in the source (sharing UI, teams) is omitted on purpose.
