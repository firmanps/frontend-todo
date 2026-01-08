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

    // Handle response dengan safe JSON parsing
    const contentType = response.headers.get("content-type");
    let data: any = {};
    
    if (contentType && contentType.includes("application/json")) {
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        // Jika JSON parsing gagal, gunakan empty object
        console.error("Error parsing JSON response:", error);
        data = {};
      }
    }

    if (response.ok) {
      // 200 = logged in
      return {
        user: data as User,
        isAuthenticated: true,
      };
    } else if (response.status === 401 || response.status === 403) {
      // 401/403 = not logged in atau session invalid
      const error: any = new Error(data.message || "Unauthorized");
      error.status = response.status;
      throw error;
    } else if (response.status === 404) {
      // 404 = user not found (akun sudah terhapus)
      const error: any = new Error(data.message || "User not found");
      error.status = 404;
      throw error;
    } else if (response.status >= 500) {
      // 500+ = server error, kemungkinan session invalid atau server issue
      // Untuk endpoint /user/me, error 500 bisa berarti session invalid
      // Lebih aman untuk logout dan minta user login lagi
      const error: any = new Error(data.message || "Server error");
      error.status = response.status;
      throw error;
    } else {
      // Error lainnya (400, 422, dll) - treat sebagai session invalid untuk safety
      const error: any = new Error(data.message || `Unexpected status: ${response.status}`);
      error.status = response.status;
      throw error;
    }
  } catch (error: any) {
    console.error("Error checking authentication:", error);
    // Re-throw error dengan status code untuk di-handle oleh AuthContext
    if (error.status) {
      throw error;
    }
    // Jika error network, treat sebagai not logged in
    return {
      user: null,
      isAuthenticated: false,
    };
  }
}
