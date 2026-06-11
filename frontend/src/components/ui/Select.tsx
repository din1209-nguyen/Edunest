"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  label,
  error,
  hint,
  disabled,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || null,
    [options, value]
  );
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  return (
    <div className={cn("w-full", className)} ref={selectRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium leading-5 text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-5 text-foreground shadow-sm transition-colors",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error",
            isOpen && "border-primary-500 ring-2 ring-primary-500/20"
          )}
        >
          <span className={cn("min-w-0 truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full animate-scaleIn rounded-lg border border-border bg-background py-1 shadow-lg">
            <div className="max-h-60 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm leading-5 transition-colors",
                    "hover:bg-surface-hover",
                    option.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {selectedOption?.value === option.value && (
                    <Check className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm leading-5 text-error">{error}</p>}
      {hint && !error && <p className="mt-1 text-sm leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}
