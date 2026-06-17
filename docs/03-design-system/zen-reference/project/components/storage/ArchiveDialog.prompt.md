The archive surface behind the row "Archive…" action and the bulk bar "Archive" button. Same sectioned chrome as the create/unlock surfaces. The head summarizes what's being archived (`“photo.jpg”` or `5 items` + destination); the name field carries a live mono extension suffix swapped by the format chips (.zip / .tar / .tar.gz); the recessed foot previews the final filename and item count. The name is pre-filled (single item's base name, else the destination slug) and pre-selected so typing replaces it; Enter submits.

```jsx
<ArchiveDialog
  open={!!archive}
  destination="Photos"
  items={archive ? archive.entries.map((e) => e.name) : []}
  onClose={() => setArchive(null)}
  onArchive={({ name, format }) => { /* add `${name}.${format}` + close */ }}
/>
```

Rules:
- `onArchive` gets the name WITHOUT extension — append `.${format}` yourself.
- Works for ONE entry (row menu) and MANY (bulk selection) — pass every name via `items`.
- Pass `formats` to narrow/extend the chip set; seed `initialName` / `initialFormat` for static cards.
