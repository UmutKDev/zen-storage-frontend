"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DialogDescription, DialogTitle } from "@/components/ui";

/**
 * Sectioned dialog chrome — a machined emblem head, a body, and a recessed
 * foot. Render INSIDE a `<DialogContent className="overflow-hidden p-0 gap-0">`
 * so the caller keeps control of open/close (and can swap the body for a
 * conflict prompt). The shared `.zs-section-*` treatment lives in globals.css.
 */
export function SectionedDialog({
  icon: Icon,
  emblemTone = "neutral",
  title,
  subtitle,
  footStart,
  footActions,
  children,
}: {
  icon: LucideIcon;
  emblemTone?: "neutral" | "armed";
  title: ReactNode;
  subtitle?: ReactNode;
  footStart?: ReactNode;
  footActions: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className="zs-section-head">
        <span
          aria-hidden
          className={cn(
            "zs-section-emblem",
            emblemTone === "armed" && "zs-section-emblem--armed",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-base font-semibold tracking-[-0.01em]">
            {title}
          </DialogTitle>
          {subtitle ? (
            <DialogDescription className="mt-0.5 truncate text-xs">
              {subtitle}
            </DialogDescription>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
      <div className="zs-section-foot">
        <div className="flex min-w-0 items-center">{footStart}</div>
        <div className="flex shrink-0 items-center gap-2">{footActions}</div>
      </div>
    </>
  );
}
