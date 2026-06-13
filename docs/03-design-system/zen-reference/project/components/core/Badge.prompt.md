Pill badge for folder/file states. Secondary (neutral) is the default — used with a 12px icon for "Encrypted"/"Hidden".

```jsx
<Badge><Icon name="lock" /> Encrypted</Badge>
<Badge variant="warning">Scan pending</Badge>
<Badge variant="destructive">Infected</Badge>
```

State variants (success/warning/info) are 15% tints with colored text; destructive is solid. Never use color decoratively.
