Segmented control — section tabs or icon-only view toggles (list/grid).

```jsx
<Tabs aria-label="View" tabs={[
  { value: "list", icon: <Icon name="list" /> },
  { value: "grid", icon: <Icon name="layout-grid" /> },
]} value={view} onValueChange={setView} />
```
