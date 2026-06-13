List-view row of the storage browser. Folder icons are brand-orange; files neutral. Checkbox/actions fade in on hover; pass `selecting` once any selection exists. `task` swaps the kind line for an inline operation readout — label + tabular percent over a thin brand rail (used by the extract queue); omit `progress` for the queued/waiting state (dimmed sweeping rail).

```jsx
<FileRow name="Documents" kind="dir" onOpen={open} onToggleSelect={toggle} onAction={menu} />
<FileRow name="Vault" kind="dir" encrypted locked onOpen={promptUnlock} />
<FileRow name="report.pdf" size={4_200_000} modified="2026-05-12" selected selecting onToggleSelect={toggle} onAction={menu} />
<FileRow name="backup.zip" size={734_000_000} task={{ label: "Extracting…", progress: 42 }} />
<FileRow name="photos.tar.gz" size={48_000_000} task={{ label: "Queued — extracts next" }} />
```
