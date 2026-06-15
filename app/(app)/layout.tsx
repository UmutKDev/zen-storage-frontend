import type { ReactNode } from "react";
import {
  AppShell,
  CommandPalette,
  ShortcutProvider,
  ShortcutsHelp,
} from "@/features/shell";
import { QuotaBanner, SidebarUsageCard, UploadTray } from "@/features/storage";
import { JobIndicator } from "@/features/jobs";

/** Authenticated app shell (sidebar + topbar). Wraps every `(app)` screen.
 *  The storage-usage card fills the sidebar footer (shown app-wide, per the
 *  design); the quota banner, job indicator, upload tray + ⌘K palette + shortcut
 *  dispatcher mount here so they survive navigation. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell sidebarFooter={<SidebarUsageCard />}>
      <QuotaBanner />
      {children}
      <UploadTray />
      <JobIndicator />
      <ShortcutProvider />
      <CommandPalette />
      <ShortcutsHelp />
    </AppShell>
  );
}
