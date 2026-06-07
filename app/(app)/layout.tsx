import type { ReactNode } from "react";
import { AppShell } from "@/features/shell";

/** Authenticated app shell (sidebar + topbar). Wraps every `(app)` screen. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
