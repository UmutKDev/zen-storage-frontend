Renders any Lucide icon by kebab-case name; requires the Lucide UMD CDN script on the page.

```jsx
<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
<Icon name="folder" size={20} style={{ color: "var(--brand)" }} />
```

Folders are tinted `var(--brand)`; everything else uses `currentColor` (usually `--muted-foreground`). 16px in controls, 20px in rows. Never use emoji or hand-drawn SVG instead.
