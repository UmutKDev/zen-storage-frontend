The signature frosted surface. ONLY for chrome (topbar, sidebar) and overlays (modals, popovers, command palette, toasts, upload tray) — content/cards/tables stay solid.

```jsx
<GlassPanel as="header" tier="chrome" style={{ height: 56, position: "sticky", top: 0 }}>…</GlassPanel>
<GlassPanel tier="overlay" style={{ borderRadius: "var(--radius-lg)", padding: 24 }}>…</GlassPanel>
```

Needs something behind it to refract — place over the app's solid base. Never animate the blur; never nest glass.
