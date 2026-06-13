The create-document surface behind "New → Document". Same sectioned chrome as the other create/unlock surfaces. The name field shows a live mono extension suffix; the format chips (.txt / .md / .html / .csv / .json by default) swap it, and the recessed foot previews the final filename in mono. Create stays disabled until a name is typed; Enter submits.

```jsx
<NewDocumentDialog
  open={createKind === "doc"}
  destination="Q2 launch"
  onClose={() => setCreateKind(null)}
  onCreate={({ name, format }) => { /* add `${name}.${format}` + close */ }}
/>
```

Rules:
- `onCreate` gets the name WITHOUT extension — append `.${format}` yourself.
- Only text formats belong here; binary types arrive via UploadDialog, never this surface.
- Pass `formats` to narrow/extend the chip set; seed `initialName` / `initialFormat` for static cards.
