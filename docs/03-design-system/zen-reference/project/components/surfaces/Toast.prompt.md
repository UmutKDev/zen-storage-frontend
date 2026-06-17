Toast for transient feedback. Errors state what failed and offer a retry path in `description`.

```jsx
<Toast variant="success" title="Moved 3 items" onClose={dismiss} />
<Toast variant="error" title="Upload failed" description="Couldn't reach the server. Retry." />
```
