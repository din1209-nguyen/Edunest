"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

export function AuthBootstrap() {
  const hasBootstrapped = useAuthStore((state) => state.hasBootstrapped);
  const bootstrapAuth = useAuthStore((state) => state.bootstrapAuth);

  useEffect(() => {
    if (!hasBootstrapped) {
      void bootstrapAuth();
    }
  }, [bootstrapAuth, hasBootstrapped]);

  return null;
}
