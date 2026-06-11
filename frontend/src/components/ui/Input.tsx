"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium leading-5 text-foreground">
            {label}
            {props.required && <span className="ml-1 text-error">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-5 text-foreground shadow-sm transition-colors",
              "placeholder:text-muted-foreground",
              "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              error && "border-error focus:border-error focus:ring-error/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm leading-5 text-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm leading-5 text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium leading-5 text-foreground">
            {label}
            {props.required && <span className="ml-1 text-error">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground shadow-sm transition-colors",
            "placeholder:text-muted-foreground",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus:border-error focus:ring-error/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm leading-5 text-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm leading-5 text-muted-foreground">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
