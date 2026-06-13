Modal on the glass-overlay tier — confirmations, rename/move, passphrase unlock. Destructive confirms name the count and consequence.

```jsx
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Delete 3 items?"
  description="This can't be undone."
  footer={<>
    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </>}
/>
```
