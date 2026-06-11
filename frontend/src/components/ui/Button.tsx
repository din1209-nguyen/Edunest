"use client";

import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold leading-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg active:bg-primary-800",
        secondary:
          "bg-secondary-600 text-white shadow-md hover:bg-secondary-700 hover:shadow-lg active:bg-secondary-800",
        outline:
          "border border-border bg-white text-foreground shadow-sm hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100",
        "outline-secondary":
          "border border-border bg-white text-foreground shadow-sm hover:border-secondary-200 hover:bg-secondary-50 hover:text-secondary-700 active:bg-secondary-100",
        ghost:
          "text-muted-foreground hover:bg-surface-hover hover:text-foreground active:bg-primary-50",
        "ghost-secondary":
          "text-muted-foreground hover:bg-secondary-50 hover:text-secondary-700 active:bg-secondary-100",
        destructive:
          "bg-error text-white shadow-sm hover:bg-red-600 active:bg-red-700",
        success:
          "bg-success text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700",
        link:
          "text-primary-600 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm sm:text-base",
        xl: "h-12 px-6 text-base",
        icon: "h-10 w-10 shrink-0 p-0",
        "icon-sm": "h-8 w-8 shrink-0 p-0",
        "icon-lg": "h-11 w-11 shrink-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const renderContent = (contentChildren: ReactNode) => (
      <>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon}
        {contentChildren}
        {rightIcon}
      </>
    );
    const content = renderContent(children);
    const buttonClassName = cn(buttonVariants({ variant, size, className }));

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
      return cloneElement(child, {
        className: cn(buttonClassName, child.props.className),
        children: renderContent(child.props.children),
      });
    }

    return (
      <button
        className={buttonClassName}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
