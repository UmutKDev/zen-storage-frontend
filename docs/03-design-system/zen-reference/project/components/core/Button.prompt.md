The standard action button; exactly one orange `primary` per view, ghosts for in-row actions, `ghost-destructive`/`destructive` for delete. `upload` is the premium hero treatment for the single most important action (the storage browser's Upload): heavier gradient, engraved icon well, shortcut chip, hover sheen.

```jsx
<Button variant="upload" title="Upload files (⌘U)">
  <span className="zs-btn__well"><Icon name="upload" /></span>
  Upload
  <kbd className="zs-btn__kbd">⌘U</kbd>
</Button>
<Button variant="outline" size="sm"><Icon name="folder-input" /> Move</Button>
<Button variant="ghost-destructive" size="sm"><Icon name="trash-2" /> Delete</Button>
<Button variant="ghost" size="icon" aria-label="More"><Icon name="more-vertical" /></Button>
```

Variants: primary · upload · secondary · outline · ghost · ghost-destructive · destructive · link. Sizes: xs/sm/default/lg + icon/icon-sm/icon-xs (square, give an `aria-label`). Icons inside are auto-sized to 16px.
