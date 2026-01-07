import { getCsrfToken } from "./axios";

export interface User {
  id: string;
  username: string;
  email: string;
  profile?: {
    image?: string;
  };
}

export interface AuthResponse {
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * Fungsi untuk cek user sudah login atau belum
 * Menggunakan Next.js API route (proxy) /api/user/me untuk menghindari CORS
 * @returns Promise<AuthResponse>
 */
export async function getMe(): Promise<AuthResponse> {
  try {
    // Dapatkan CSRF token terlebih dahulu
    const csrfToken = await getCsrfToken();

    // Request melalui Next.js API route (proxy) untuk menghindari CORS
    const response = await fetch("/api/user/me", {
      method: "GET",
      credentials: "include", // Include cookies (access_token httpOnly)
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Sertakan CSRF token jika ada
      },
    });

    if (response.ok) {
      // 200 = logged in
      const user: User = await response.json();
      return {
        user,
        isAuthenticated: true,
      };
    } else if (response.status === 401) {
      // 401 = not logged in
      return {
        user: null,
        isAuthenticated: false,
      };
    } else {
      // Error lainnya
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error checking authentication:", error);
    // Jika error, treat sebagai not logged in
    return {
      user: null,
      isAuthenticated: false,
    };
  }
}
