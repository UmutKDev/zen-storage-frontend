import type { ReactNode } from "react";

/**
 * Authenticated app shell. The real Sidebar/Topbar (features/shell) mounts here
 * in Phase 2; for now it's an empty themed surface.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>;
}
