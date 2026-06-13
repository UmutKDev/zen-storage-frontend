Anchored dropdown for split/overflow actions (the "New" button, row ⋯ menus). Glass overlay tier; items are icon-tile + label + optional description/kbd rows. Wrap the trigger and the Menu in one `position: relative` element — outside pointer-downs close it, so the trigger's onClick can simply toggle.

```jsx
const [open, setOpen] = React.useState(false);

<div style={{ position: "relative" }}>
  <Button variant="outline" size="sm" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
    <Icon name="plus" /> New <Icon name="chevron-down" size={13} />
  </Button>
  <Menu
    open={open}
    onClose={() => setOpen(false)}
    align="end"
    items={[
      { icon: "folder-plus", label: "Directory", description: "Folder — optionally encrypted", onSelect: openDirDialog },
      { icon: "file-plus", label: "Document", description: "Plain text, Markdown, HTML…", onSelect: openDocDialog },
    ]}
  />
</div>
```

Rules:
- `align="end"` when the trigger sits at the right edge of a toolbar.
- Use `"separator"` between groups; `danger: true` for destructive items (never primary-orange).
- Descriptions are optional — omit them for compact utility menus.
