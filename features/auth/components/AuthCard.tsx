import type { ReactNode } from "react";

/**
 * Auth form container. SOLID `surface-elevated` (not glass) — per the
 * glassmorphism contract, forms/content stay solid; glass is chrome/overlays.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full rounded-lg border border-border bg-surface-elevated p-6 shadow-e2 sm:p-8">
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
