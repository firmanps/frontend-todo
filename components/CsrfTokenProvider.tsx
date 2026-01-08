"use client";

import { useEffect, useRef } from "react";
import { initializeCsrfToken, resetCsrfToken, getCsrfToken } from "@/lib/axios";

export function CsrfTokenProvider({ children }: { children: React.ReactNode }) {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return; // cegah double-run di dev
    initializedRef.current = true;

    initializeCsrfToken().catch((error) => {
      console.error("Failed to initialize CSRF token:", error);
    });

    refreshIntervalRef.current = setInterval(async () => {
      try {
        resetCsrfToken();
        await getCsrfToken(true);
      } catch (error) {
        console.error("Failed to refresh CSRF token:", error);
      }
    }, 25 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  return <>{children}</>;
}
