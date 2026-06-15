import type { ReactNode } from "react";
import {
  AppShell,
  CommandPalette,
  ShortcutProvider,
  ShortcutsHelp,
} from "@/features/shell";
import { QuotaBanner, SidebarUsageCard, UploadTray } from "@/features/storage";

/** Authenticated app shell (sidebar + topbar). Wraps every `(app)` screen.
 *  The storage-usage card fills the sidebar footer (shown app-wide, per the
 *  design); the quota banner, upload tray + ⌘K palette + shortcut dispatcher
 *  mount here so they survive navigation (background tasks live in the topbar
 *  `JobsMenu`). */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell sidebarFooter={<SidebarUsageCard />}>
      <QuotaBanner />
      {children}
      <UploadTray />
      <ShortcutProvider />
      <CommandPalette />
      <ShortcutsHelp />
    </AppShell>
  );
}
