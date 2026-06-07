"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { Topbar } from "./Topbar";

/**
 * Authenticated app shell: persistent desktop sidebar + mobile drawer + topbar,
 * wrapping every `(app)` screen. The workspace-switch slot is present but inert
 * until Phase 8.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
