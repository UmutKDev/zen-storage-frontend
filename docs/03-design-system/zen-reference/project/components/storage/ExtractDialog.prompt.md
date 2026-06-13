The extract confirmation surface — nothing is queued without it. Same sectioned chrome as the other create/unlock surfaces. Two modes by `items` length:

- **Single archive:** destination line ("Into a new folder `backup-2026/`") plus — when `contents` is passed — a "Preview contents" disclosure with a select-all checklist of the archive's top-level entries; the user can extract only some of them. Preview/selection is single-only.
- **Bulk (2+):** a numbered order list; archives extract one at a time in that order. No preview.

```jsx
<ExtractDialog
  open={!!ask}
  destination="Home"
  items={ask ? ask.entries.map((e) => ({ name: e.name, size: e.size })) : []}
  contents={ask && ask.entries.length === 1 ? contentsOf(ask.entries[0]) : undefined}
  onClose={() => setAsk(null)}
  onExtract={({ selection }) => { /* enqueue each archive; selection limits the single one */ }}
/>
```

Rules:
- `onExtract`'s `selection` is undefined unless the user previewed AND deselected something — treat undefined as "everything".
- Omit `contents` when the archive's contents are unknown; the dialog shows a quiet note instead of the disclosure.
- Extract stays disabled if the user deselects every entry; Esc/backdrop cancels.
