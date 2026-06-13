Grid-view card; centered 40px icon, 2-line name clamp, checkbox top-left + actions top-right on hover. Lay out in a `repeat(auto-fill, minmax(140px, 1fr))` grid.

```jsx
<FileCard name="Photos" kind="dir" onOpen={open} onToggleSelect={toggle} onAction={menu} />
<FileCard name="demo-final.mp4" size={734_000_000} onToggleSelect={toggle} onAction={menu} />
```
