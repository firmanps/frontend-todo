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
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "AuthContext.tsx:37",
        message: "isPublicRoute called",
        data: {
          path,
          result: path === "/" || path === "/auth" || path.startsWith("/auth"),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
    return path === "/" || path === "/auth" || path.startsWith("/auth");
  };

  const checkAuth = async () => {
    // CRITICAL: Skip auth check jika sedang di public route
    // Ini mencegah infinite loop dan toast spam di public routes
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : pathname || "";
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "AuthContext.tsx:41",
        message: "checkAuth entry",
        data: {
          currentPath,
          pathname,
          windowPath:
            typeof window !== "undefined" ? window.location.pathname : "N/A",
          isPublic: isPublicRoute(currentPath),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion

    if (isPublicRoute(currentPath)) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "AuthContext.tsx:47",
            message: "checkAuth skipped - public route",
            data: { currentPath },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
      // #endregion
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
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "AuthContext.tsx:111",
            message: "checkAuth error caught",
            data: {
              errorStatus,
              currentPathAfter:
                typeof window !== "undefined"
                  ? window.location.pathname
                  : pathname || "",
              isPublic: isPublicRoute(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : pathname || ""
              ),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }),
        }
      ).catch(() => {});
      // #endregion
      if (
        errorStatus === 401 ||
        errorStatus === 403 ||
        errorStatus === 404 ||
        errorStatus >= 500
      ) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "AuthContext.tsx:117",
              message: "Calling logout from checkAuth error",
              data: { errorStatus },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "D",
            }),
          }
        ).catch(() => {});
        // #endregion
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
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "AuthContext.tsx:141",
            message: "logout called",
            data: {
              message,
              currentPath:
                typeof window !== "undefined"
                  ? window.location.pathname
                  : pathname || "",
              isLoggingOut: isLoggingOutRef.current,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }),
        }
      ).catch(() => {});
      // #endregion
      // Guard: prevent multiple logout calls
      if (isLoggingOutRef.current) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "AuthContext.tsx:144",
              message: "logout skipped - already logging out",
              data: {},
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "D",
            }),
          }
        ).catch(() => {});
        // #endregion
        return;
      }

      // Set flag untuk mencegah multiple calls
      isLoggingOutRef.current = true;

      // Clear user state
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "AuthContext.tsx:152",
            message: "Clearing user state",
            data: {},
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "E",
          }),
        }
      ).catch(() => {});
      // #endregion
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
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "AuthContext.tsx:186",
        message: "useEffect pathname changed",
        data: {
          pathname,
          pathnameType: typeof pathname,
          windowPath:
            typeof window !== "undefined" ? window.location.pathname : "N/A",
          isPublic: isPublicRoute(pathname || ""),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    // Skip checkAuth jika sedang di public route
    if (isPublicRoute(pathname || "")) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "AuthContext.tsx:189",
            message: "Skipping checkAuth - public route",
            data: { pathname },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
      // #endregion
      // Jika di public route, set state sebagai not authenticated tanpa check
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    } else {
      // #region agent log
      fetch(
        "http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "AuthContext.tsx:195",
            message: "Calling checkAuth - private route",
            data: { pathname },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }
      ).catch(() => {});
      // #endregion
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
