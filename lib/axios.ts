import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

// Base URL dari environment variable atau default
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

// CSRF Token storage
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;
let csrfTokenTimestamp: number | null = null;
const CSRF_TOKEN_TTL = 30 * 60 * 1000; // 30 menit (token dianggap expired setelah 30 menit)

// Fungsi untuk fetch CSRF token
const fetchCsrfToken = async (forceRefresh = false): Promise<string> => {
  // Cek apakah token masih valid (belum expired)
  const now = Date.now();
  if (
    !forceRefresh &&
    csrfToken &&
    csrfTokenTimestamp &&
    now - csrfTokenTimestamp < CSRF_TOKEN_TTL
  ) {
    return csrfToken;
  }

  // Jika sedang fetching, return promise yang sama
  if (csrfTokenPromise && !forceRefresh) {
    return csrfTokenPromise;
  }

  // Fetch CSRF token melalui Next.js API route (proxy) untuk menghindari CORS
  // Menggunakan fetch langsung karena Next.js API route di domain yang sama
  csrfTokenPromise = fetch("/api/csrf", {
    method: "GET",
    credentials: "include", // Include cookies
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.csrfToken) {
        throw new Error("CSRF token not found in response");
      }
      csrfToken = data.csrfToken;
      csrfTokenTimestamp = Date.now(); // Simpan timestamp saat token di-fetch
      csrfTokenPromise = null;
      return csrfToken as string;
    })
    .catch((error) => {
      // Reset token jika fetch gagal
      csrfToken = null;
      csrfTokenTimestamp = null;
      csrfTokenPromise = null;
      console.error("Error fetching CSRF token:", error);
      throw error;
    });

  return csrfTokenPromise;
};

// Buat instance axios
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 detik
  withCredentials: true, // Include credentials (cookies) di setiap request
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - untuk menambahkan CSRF token dan auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    // Pastikan CSRF token sudah di-fetch
    try {
      const token = await fetchCsrfToken();
      if (token) {
        config.headers["X-CSRF-Token"] = token;
      }
    } catch (error) {
      console.error("Failed to get CSRF token:", error);
    }

    // Ambil auth token dari localStorage jika ada
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        try {
          const userData = JSON.parse(user);
          // Jika ada token di user data, tambahkan ke header
          if (userData.token) {
            config.headers.Authorization = `Bearer ${userData.token}`;
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Guard flag untuk mencegah multiple logout events
let isLoggingOut = false;

// Response interceptor - untuk handle error global
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Skip jika sedang dalam proses logout
    if (isLoggingOut) {
      return Promise.reject(error);
    }
    
    // Handle error berdasarkan status code
    if (error.response) {
      switch (error.response.status) {
        case 401:
        case 404:
          // Unauthorized atau User not found (akun terhapus) - trigger logout
          // Check jika ini endpoint auth
          const requestUrl = error.config?.url || "";
          const isAuthEndpoint =
            requestUrl.includes("/user/me") ||
            requestUrl.includes("/auth/");
          
          // CRITICAL: Skip logout logic jika sedang di halaman auth
          // Ini mencegah infinite loop karena logout akan redirect ke /auth yang trigger request lagi
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const isOnAuthPage = currentPath === "/auth" || currentPath.startsWith("/auth");
            const isOnHomePage = currentPath === "/";
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'axios.ts:132',message:'401/404 error in interceptor',data:{requestUrl,isAuthEndpoint,currentPath,isOnAuthPage,isOnHomePage,isLoggingOut,willTriggerLogout:isAuthEndpoint && !isLoggingOut && !isOnAuthPage && !isOnHomePage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            
            if (isAuthEndpoint && !isLoggingOut && !isOnAuthPage && !isOnHomePage) {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/2c4de73c-ab75-46bb-b94e-bb03387424f4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'axios.ts:142',message:'Dispatching auth:logout event',data:{status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              // Set flag untuk mencegah multiple events
              isLoggingOut = true;
              
              // Trigger logout via event untuk di-handle oleh AuthContext
              // AuthContext akan handle toast dan redirect, jadi kita tidak perlu duplicate
              const event = new CustomEvent("auth:logout", {
                detail: {
                  message:
                    error.response?.status === 404
                      ? "Account deleted. Please login again."
                      : "Session expired. Please login again.",
                },
              });
              window.dispatchEvent(event);
            }
          }
          break;
        case 403:
          // Forbidden - mungkin CSRF token invalid, coba refresh
          const errorMessage = (error.response.data as any)?.message || "";
          const errorData = (error.response.data as any) || {};
          
          // Jika error terkait CSRF token atau token invalid, refresh token
          if (
            errorMessage.toLowerCase().includes("csrf") ||
            errorMessage.toLowerCase().includes("token") ||
            errorMessage.toLowerCase().includes("invalid") ||
            errorData.error?.toLowerCase().includes("csrf") ||
            errorData.error?.toLowerCase().includes("token")
          ) {
            // Reset dan refresh CSRF token dengan force refresh
            resetCsrfToken();
            try {
              const newToken = await fetchCsrfToken(true);
              // Retry request jika config tersedia
              if (error.config && newToken) {
                // Update CSRF token di config
                error.config.headers = error.config.headers || {};
                error.config.headers["X-CSRF-Token"] = newToken;
                return axiosInstance.request(error.config);
              }
            } catch (refreshError) {
              console.error("Failed to refresh CSRF token:", refreshError);
              // Jika refresh gagal, reset token dan biarkan user refresh page
              resetCsrfToken();
            }
          }
          console.error("Forbidden: Anda tidak memiliki akses");
          break;
        case 404:
          console.error("Not Found: Resource tidak ditemukan");
          break;
        case 500:
          console.error("Server Error: Terjadi kesalahan di server");
          break;
        default:
          console.error("Error:", error.message);
      }
    } else if (error.request) {
      console.error("Network Error: Tidak ada response dari server");
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

// Helper functions untuk berbagai HTTP methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get<T>(url, config).then((response) => response.data);
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return axiosInstance
      .post<T>(url, data, config)
      .then((response) => response.data);
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return axiosInstance
      .put<T>(url, data, config)
      .then((response) => response.data);
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return axiosInstance
      .patch<T>(url, data, config)
      .then((response) => response.data);
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance
      .delete<T>(url, config)
      .then((response) => response.data);
  },
};

// Export instance jika diperlukan untuk penggunaan khusus
export default axiosInstance;

// Export fungsi untuk manual fetch CSRF token (untuk digunakan di layout)
export const initializeCsrfToken = async (): Promise<void> => {
  try {
    await fetchCsrfToken();
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);
  }
};

// Export fungsi untuk reset CSRF token (jika perlu refresh)
export const resetCsrfToken = (): void => {
  csrfToken = null;
  csrfTokenPromise = null;
  csrfTokenTimestamp = null;
};

// Export fungsi untuk mendapatkan CSRF token (untuk digunakan di fetch request)
export const getCsrfToken = async (forceRefresh = false): Promise<string | null> => {
  try {
    return await fetchCsrfToken(forceRefresh);
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    // Jika error, reset token dan return null
    resetCsrfToken();
    return null;
  }
};
