"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantClasses = {
    default: "bg-gradient-to-r from-primary-500 to-primary-600",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tiến độ</span>
          <span className="font-medium text-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-surface-hover", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", variantClasses[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
