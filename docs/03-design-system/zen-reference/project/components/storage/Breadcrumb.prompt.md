Path breadcrumb above the file list. Every crumb is a pill: ancestors are quiet ghost pills that fill on hover (also drag-move drop targets in production); the current location is a raised machined chip with a brand-tinted glyph — hard-drive at root, folder inside.

```jsx
<Breadcrumb segments={["Projects", "Q2 launch"]} onNavigate={(depth) => goTo(depth)} />
```
