import type { ReactNode } from "react";
import { AppShell } from "@/features/shell";
import { UploadTray } from "@/features/storage";

/** Authenticated app shell (sidebar + topbar). Wraps every `(app)` screen.
 *  The upload tray mounts here so the queue survives folder navigation. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
      <UploadTray />
    </AppShell>
  );
}
