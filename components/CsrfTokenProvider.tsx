"use client";

import { useEffect } from "react";
import { initializeCsrfToken } from "@/lib/axios";

export function CsrfTokenProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fetch CSRF token saat component mount
    initializeCsrfToken().catch((error) => {
      console.error("Failed to initialize CSRF token:", error);
    });
  }, []);

  return <>{children}</>;
}

