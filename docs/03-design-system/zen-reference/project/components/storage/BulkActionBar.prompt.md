Floating pill shown while a selection exists — count, select-all, then Move / Archive / Extract / Download / Delete / clear. Solid elevated (not glass); delete is ghost-destructive. Archive renders only when `onArchive` is passed (opens ArchiveDialog over the selection); Extract only when `onExtract` is — pass it when the selection contains archives (opens ExtractDialog, which queues them one at a time).

```jsx
<BulkActionBar count={3} canDownload onMove={...} onArchive={...} onExtract={...} onDownload={...} onDelete={...} onClear={...} />
```
