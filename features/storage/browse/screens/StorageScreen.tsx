"use client";

import { StorageBrowser } from "../components/StorageBrowser";

/**
 * Storage browse screen. Fills the shell's content area (viewport − topbar h-14
 * − main py-6 ≈ 6.5rem) so the list/grid gets its own scroll region rather than
 * scrolling the whole page.
 */
export function StorageScreen({ path }: { path: string }) {
  return (
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-0 flex-col">
      <StorageBrowser path={path} />
    </div>
  );
}
