"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils/index"

const PROGRESS_TONE = {
  brand: "bg-brand",
  warning: "bg-warning",
  danger: "bg-danger",
} as const

function Progress({
  className,
  value,
  tone = "brand",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  tone?: keyof typeof PROGRESS_TONE
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {/* Tokenized: transform-only, duration.base (200ms) + standard easing
          from the design system (motion/variants.md `progress` contract). */}
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-transform duration-200 ease-standard",
          PROGRESS_TONE[tone]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
