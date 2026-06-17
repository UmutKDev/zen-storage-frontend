Justified "smart grid" for grid view (Yandex-Disk-style): each row fills the container width at a uniform height; tiles keep their natural aspect ratio. Fill with `FileTile`s — media tiles pass `thumb` + `ratio` (w/h), folders/docs render as squares and mix into the same rows. Pure CSS; responsive with no JS measurement.

```jsx
<SmartGrid rowHeight={168}>
  <FileTile name="Albums" kind="dir" childCount={3} onOpen={open} onToggleSelect={toggle} onAction={menu} />
  <FileTile name="dunes.jpg" thumb="assets/thumbs/dunes.jpg" ratio={16 / 9} size={4_100_000} onOpen={open} onToggleSelect={toggle} onAction={menu} />
  <FileTile name="clip.mp4" thumb="assets/thumbs/video-demo.jpg" ratio={16 / 9} duration="0:42" onOpen={open} onToggleSelect={toggle} onAction={menu} />
</SmartGrid>
```
