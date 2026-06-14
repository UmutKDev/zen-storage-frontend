import type { ReactNode } from "react";
import {
  AppShell,
  CommandPalette,
  ShortcutProvider,
  ShortcutsHelp,
} from "@/features/shell";
import { SidebarUsageCard, UploadTray } from "@/features/storage";

/** Authenticated app shell (sidebar + topbar). Wraps every `(app)` screen.
 *  The storage-usage card fills the sidebar footer (shown app-wide, per the
 *  design); the upload tray + ⌘K palette + shortcut dispatcher mount here so they
 *  survive navigation. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell sidebarFooter={<SidebarUsageCard />}>
      {children}
      <UploadTray />
      <ShortcutProvider />
      <CommandPalette />
      <ShortcutsHelp />
    </AppShell>
  );
}
