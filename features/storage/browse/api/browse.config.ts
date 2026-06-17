/**
 * Background refresh cadence for folder listings (directories + objects), so
 * changes made elsewhere — an upload finishing, a folder created, an entry moved
 * or deleted from another tab/device/teammate — surface without a manual reload.
 *
 * Polling pauses while the tab is hidden (TanStack's default
 * `refetchIntervalInBackground: false`); a window-focus refetch catches whatever
 * changed while away. 60s matches the notifications poll cadence — frequent
 * enough to feel live, light enough to not hammer the listing endpoints.
 */
export const BROWSE_REFETCH_INTERVAL_MS = 60_000;
