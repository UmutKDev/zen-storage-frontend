Smart-grid tile for `SmartGrid`. With `thumb` + `ratio` it renders the image full-bleed with a bottom name scrim (videos get a play chip + `duration`); without, a square icon tile matching FileCard's tinted-icon look. Checkbox top-left + actions top-right reveal on hover; selected media shrinks inside an accent ring (Yandex-style).

```jsx
<FileTile name="kyoto-garden.jpg" thumb="assets/thumbs/kyoto-garden.jpg" ratio={3 / 2} size={5_400_000} onOpen={open} onToggleSelect={toggle} onAction={menu} />
<FileTile name="Albums" kind="dir" childCount={3} onOpen={open} onToggleSelect={toggle} onAction={menu} />
```
