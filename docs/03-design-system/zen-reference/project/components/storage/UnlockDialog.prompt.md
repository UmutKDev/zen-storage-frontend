Password gate for protected content — the dialog behind encrypted folders and the hidden-items reveal (double-Shift ⇧⇧ gesture). Sectioned chrome in the upload surface's language: machined emblem header (orange lock for folders, neutral eye-off disc for hidden), password field with show/hide toggle, encrypted footer. Wrong password = panel shake + inline error. The parent owns the secret via `verify` and decides what unlock means via `onUnlock`.

```jsx
<UnlockDialog open={!!target} variant="folder" name="Vault" verify={(pw) => pw === secret} onUnlock={enterFolder} onClose={close} />
<UnlockDialog open={revealing} variant="hidden" verify={(pw) => pw === secret} onUnlock={() => setHiddenVisible(true)} onClose={close} />
```

Pairs with FileRow / FileCard / FileTile `encrypted` / `hidden` / `locked` props: locked items still fire `onOpen`, so route that click here. Enter submits, Esc closes.
