The create-directory surface behind "New → Directory". Sectioned chrome shared with UnlockDialog: emblem head, form body, recessed foot. Checking **Encrypted** arms the folder — the emblem flips neutral disc → orange `folder-lock`, a password field rises in (show/hide eye), and the foot shows the AES-256 cipher note. Checking **Hidden** conceals the folder until the ⇧⇧ reveal gate. Create stays disabled until the name (and password, when armed) is filled.

```jsx
<NewFolderDialog
  open={createKind === "dir"}
  destination="My storage"
  onClose={() => setCreateKind(null)}
  onCreate={({ name, encrypted, password, hidden }) => { /* create + close */ }}
/>
```

Rules:
- `destination` is the current breadcrumb leaf — never a full path string.
- The parent owns creation: remember `password` for the matching UnlockDialog gate when `encrypted`; `hidden` folders join the ⇧⇧-revealed set.
- For static demos/cards, seed `initialName` / `initialEncrypted` / `initialHidden`.
