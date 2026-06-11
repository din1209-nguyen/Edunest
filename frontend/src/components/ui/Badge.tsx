"use client";

import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-600 text-white",
        secondary:
          "border-transparent bg-secondary-600 text-white",
        outline:
          "border-border bg-background text-foreground",
        success:
          "border-success/20 bg-success-light text-secondary-800",
        warning:
          "border-warning/25 bg-warning-light text-accent-900",
        error:
          "border-error/20 bg-error-light text-red-800",
        info:
          "border-info/20 bg-info-light text-primary-800",
        "primary-light":
          "border-primary-200 bg-primary-50 text-primary-700",
        "secondary-light":
          "border-secondary-200 bg-secondary-50 text-secondary-700",
      },
      size: {
        sm: "px-2 py-0 text-[10px] leading-4",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

// Badge with dot indicator
function BadgeDot({ className, color = "bg-success", ...props }: { color?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props}>
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {props.children}
    </div>
  );
}

export { Badge, BadgeDot, badgeVariants };
