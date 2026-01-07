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

// Fungsi untuk fetch CSRF token
const fetchCsrfToken = async (): Promise<string> => {
  // Jika sudah ada token, return langsung
  if (csrfToken) {
    return csrfToken;
  }

  // Jika sedang fetching, return promise yang sama
  if (csrfTokenPromise) {
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
      csrfTokenPromise = null;
      return csrfToken as string;
    })
    .catch((error) => {
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

// Response interceptor - untuk handle error global
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle error berdasarkan status code
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect ke login
          if (typeof window !== "undefined") {
            localStorage.removeItem("user");
            window.location.href = "/auth";
          }
          break;
        case 403:
          // Forbidden - mungkin CSRF token invalid, coba refresh
          const errorMessage = (error.response.data as any)?.message || "";
          if (
            errorMessage.toLowerCase().includes("csrf") ||
            errorMessage.toLowerCase().includes("token")
          ) {
            // Reset dan refresh CSRF token
            resetCsrfToken();
            try {
              await fetchCsrfToken();
              // Retry request jika config tersedia
              if (error.config) {
                return axiosInstance.request(error.config);
              }
            } catch (refreshError) {
              console.error("Failed to refresh CSRF token:", refreshError);
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
};

// Export fungsi untuk mendapatkan CSRF token (untuk digunakan di fetch request)
export const getCsrfToken = async (): Promise<string | null> => {
  try {
    return await fetchCsrfToken();
  } catch (error) {
    console.error("Failed to get CSRF token:", error);
    return null;
  }
};
