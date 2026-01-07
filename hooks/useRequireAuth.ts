"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook untuk proteksi route
 * Redirect ke /auth jika belum login
 * @param redirectTo - Path untuk redirect setelah login (default: current path)
 */
export function useRequireAuth(redirectTo?: string) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const nextPath = redirectTo || currentPath;
      router.replace(`/auth?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

