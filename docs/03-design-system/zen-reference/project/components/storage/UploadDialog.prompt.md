The premium upload surface — the design function behind the `upload` Button variant. A heavy, sectioned modal: machined orange emblem header (mirrors the upload button's gradient), engraved-disc dropzone (click-to-browse, drag-and-drop, and an "Upload a folder" pill for whole-folder picks), a queue where each item runs encrypting → uploading → done on a thin brand-gradient rail, and an encrypted footer with running summary. Folders — picked or dropped — collapse to a single brand-toned row showing file count + aggregate size ("Scanning…" while a dropped tree is being measured).

```jsx
const [uploadOpen, setUploadOpen] = React.useState(false);

<Button variant="upload" onClick={() => setUploadOpen(true)}>…</Button>
<UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} destination="Q2 launch" />
```

Rules:
- Exactly one UploadDialog per app, opened by the single `upload` button (and ⌘U).
- `destination` is the current breadcrumb leaf — never a full path string.
- Uploads run in the background: the footer button is "Hide" while in flight, "Done" when complete. No blocking "Start upload" step.
- For static demos/cards, seed `initialItems` with explicit `status`/`progress` (use `kind: "folder"` + `count` for folder rows) and set `simulate={false}`.
