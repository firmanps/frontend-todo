"use client";

import { getMe, type User } from "@/lib/auth";
import { resetCsrfToken } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { usePathname, useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
  logout: (message?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Guard flags untuk mencegah multiple calls
  const isLoggingOutRef = React.useRef(false);
  const isCheckingAuthRef = React.useRef(false);

  // Helper untuk cek apakah sedang di public route (tidak perlu auth check)
  const isPublicRoute = (path: string) => {
    return path === "/" || path === "/auth" || path.startsWith("/auth");
  };

  const checkAuth = async () => {
    // CRITICAL: Skip auth check jika sedang di public route
    // Ini mencegah infinite loop dan toast spam di public routes
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : pathname || "";

    if (isPublicRoute(currentPath)) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Skip jika sedang dalam proses logout atau sedang check auth
    if (isLoggingOutRef.current || isCheckingAuthRef.current) {
      return;
    }

    isCheckingAuthRef.current = true;
    setIsLoading(true);

    try {
      const result = await getMe();

      // Skip jika sedang logout saat async operation
      if (isLoggingOutRef.current) {
        return;
      }

      // Double check: skip jika sekarang di public route (pathname bisa berubah saat async)
      const currentPathAfter =
        typeof window !== "undefined"
          ? window.location.pathname
          : pathname || "";
      if (isPublicRoute(currentPathAfter)) {
        setUser(null);
        setIsAuthenticated(false);
        isCheckingAuthRef.current = false;
        setIsLoading(false);
        return;
      }

      setUser(result.user);
      setIsAuthenticated(result.isAuthenticated);
    } catch (error: any) {
      // Skip jika sedang dalam proses logout
      if (isLoggingOutRef.current) {
        return;
      }

      // CRITICAL: Skip logout logic jika sudah di public route
      // Ini mencegah infinite loop dan toast spam di public routes
      const currentPathAfter =
        typeof window !== "undefined"
          ? window.location.pathname
          : pathname || "";

      if (isPublicRoute(currentPathAfter)) {
        setUser(null);
        setIsAuthenticated(false);
        isCheckingAuthRef.current = false;
        setIsLoading(false);
        return;
      }

      console.error("Auth check error:", error);

      // Jika error dari endpoint /user/me, kemungkinan session invalid
      // Handle semua error status code yang mengindikasikan session invalid
      // Hanya trigger logout jika di private route
      const errorStatus = error?.status;
      if (
        errorStatus === 401 ||
        errorStatus === 403 ||
        errorStatus === 404 ||
        errorStatus >= 500
      ) {
        // 401/403 = Unauthorized/Forbidden (session invalid)
        // 404 = User not found (akun terhapus)
        // 500+ = Server error (kemungkinan session invalid atau server issue)
        // Untuk safety, logout dan minta user login lagi
        const message =
          errorStatus === 404
            ? "Account deleted. Please login again."
            : errorStatus >= 500
            ? "Server error. Please login again."
            : "Session expired. Please login again.";
        logout(message);
        return;
      }

      // Untuk error lainnya (network error, dll), treat sebagai not logged in
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      isCheckingAuthRef.current = false;
      setIsLoading(false);
    }
  };

  const logout = useCallback(
    (message?: string) => {
      // Guard: prevent multiple logout calls
      if (isLoggingOutRef.current) {
        return;
      }

      // Set flag untuk mencegah multiple calls
      isLoggingOutRef.current = true;

      // Clear user state
      setUser(null);
      setIsAuthenticated(false);

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("todos");
      }

      // Reset CSRF token
      resetCsrfToken();

      // Show toast if message provided (hanya sekali)
      if (message) {
        toast.error(message);
      }

      // Redirect to auth page
      // Gunakan window.location.replace() untuk force redirect
      // karena router.replace() mungkin tidak bekerja di semua kondisi (terutama saat error)
      if (typeof window !== "undefined") {
        // Delay sedikit untuk memastikan toast terlihat
        setTimeout(() => {
          window.location.replace("/auth");
        }, 500);
      } else {
        // Fallback untuk SSR
        router.replace("/auth");
      }
    },
    [router]
  );

  // Check auth saat component mount dan saat pathname berubah
  useEffect(() => {
    // Skip checkAuth jika sedang di public route
    if (isPublicRoute(pathname || "")) {
      // Jika di public route, set state sebagai not authenticated tanpa check
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    } else {
      // Hanya check auth jika di private route
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Setup logout event listener (hanya sekali)
  useEffect(() => {
    // Listen untuk logout event dari axios interceptor
    const handleLogoutEvent = (event: CustomEvent) => {
      // Skip jika sedang dalam proses logout atau sudah di public route
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";

      if (isLoggingOutRef.current || isPublicRoute(currentPath)) {
        return;
      }

      const message = event.detail?.message;
      logout(message);
    };

    window.addEventListener("auth:logout", handleLogoutEvent as EventListener);

    return () => {
      window.removeEventListener(
        "auth:logout",
        handleLogoutEvent as EventListener
      );
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        refetch: checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
