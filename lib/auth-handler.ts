/**
 * Global handler untuk response API yang menangani auto logout
 * Digunakan untuk fetch request yang bukan menggunakan axios
 */

import { resetCsrfToken } from "./axios";

let logoutHandler: ((message?: string) => void) | null = null;

/**
 * Set logout handler dari AuthContext
 */
export function setLogoutHandler(handler: (message?: string) => void) {
  logoutHandler = handler;
}

/**
 * Handle response error dan trigger logout jika perlu
 */
export async function handleApiResponse(
  response: Response,
  url: string
): Promise<Response> {
  // Cek apakah ini endpoint auth yang perlu di-handle
  const isAuthEndpoint =
    url.includes("/api/user/me") ||
    url.includes("/v1/user/me") ||
    url.includes("/api/auth/") ||
    url.includes("/v1/auth/");

  if (!isAuthEndpoint) {
    return response;
  }

  // Handle error status codes
  if (response.status === 401 || response.status === 403) {
    // Unauthorized atau Forbidden - session invalid
    if (logoutHandler) {
      logoutHandler("Session expired. Please login again.");
    } else {
      // Fallback jika handler belum di-set
      if (typeof window !== "undefined") {
        resetCsrfToken();
        localStorage.removeItem("user");
        localStorage.removeItem("todos");
        window.location.href = "/auth";
      }
    }
  } else if (response.status === 404 && url.includes("/user/me")) {
    // 404 dari /user/me berarti user not found (akun sudah terhapus)
    const data = await response.json().catch(() => ({}));
    const message =
      data.message || "Account deleted. Please login again.";

    if (logoutHandler) {
      logoutHandler(message);
    } else {
      // Fallback jika handler belum di-set
      if (typeof window !== "undefined") {
        resetCsrfToken();
        localStorage.removeItem("user");
        localStorage.removeItem("todos");
        window.location.href = "/auth";
      }
    }
  }

  return response;
}

