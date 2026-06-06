import type { ReactNode } from "react";

/** Public (marketing) shell. Real content lands in Phase 7. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
