import type { ReactNode } from "react";

/** Minimal centered auth shell. Real auth screens land in Phase 1. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
