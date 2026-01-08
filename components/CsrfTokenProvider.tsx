"use client";

import { useEffect, useRef } from "react";
import { initializeCsrfToken, resetCsrfToken, getCsrfToken } from "@/lib/axios";

export function CsrfTokenProvider({ children }: { children: React.ReactNode }) {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch CSRF token saat component mount
    initializeCsrfToken().catch((error) => {
      console.error("Failed to initialize CSRF token:", error);
    });

    // Setup periodic refresh untuk CSRF token (setiap 25 menit)
    // Refresh sebelum token expired (token TTL = 30 menit)
    refreshIntervalRef.current = setInterval(async () => {
      try {
        // Reset token lama dan fetch token baru
        resetCsrfToken();
        await getCsrfToken(true);
      } catch (error) {
        console.error("Failed to refresh CSRF token:", error);
      }
    }, 25 * 60 * 1000); // 25 menit

    // Cleanup interval saat component unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return <>{children}</>;
}

