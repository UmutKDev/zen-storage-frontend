import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils/index"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "zs-badge-grad-default text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight)] [a&]:hover:bg-secondary/90",
        destructive: "zs-badge-grad-destructive text-destructive-foreground",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        info: "bg-info/15 text-info",
        outline:
          "border-border text-foreground shadow-[inset_0_1px_0_0_var(--glass-highlight)] [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
