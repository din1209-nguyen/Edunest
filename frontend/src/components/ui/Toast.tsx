"use client";

import { useMemo } from "react";
import { useToastStore } from "@/stores/wishlistStore";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-4 shadow-lg animate-slideIn",
            "min-w-[300px] max-w-[400px]",
            toast.type === "success" && "border-success/30 bg-success-light",
            toast.type === "error" && "border-error/30 bg-error-light",
            toast.type === "warning" && "border-warning/30 bg-warning-light",
            toast.type === "info" && "border-info/30 bg-info-light"
          )}
        >
          {toast.type === "success" && (
            <CheckCircle className="h-5 w-5 text-success shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="h-5 w-5 text-error shrink-0" />
          )}
          {toast.type === "warning" && (
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          )}
          {toast.type === "info" && (
            <Info className="h-5 w-5 text-info shrink-0" />
          )}
          <p className="flex-1 text-sm font-medium text-foreground">
            {toast.message}
          </p>
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded-lg p-1 transition-colors hover:bg-black/5"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Hook for easy toast usage
export function useToast() {
  const { addToast } = useToastStore();

  return useMemo(
    () => ({
      success: (message: string, duration?: number) =>
        addToast({ type: "success", message, duration }),
      error: (message: string, duration?: number) =>
        addToast({ type: "error", message, duration }),
      warning: (message: string, duration?: number) =>
        addToast({ type: "warning", message, duration }),
      info: (message: string, duration?: number) =>
        addToast({ type: "info", message, duration }),
    }),
    [addToast],
  );
}
