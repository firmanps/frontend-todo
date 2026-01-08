// // lib/axios.ts - bagian fetchCsrfToken saja
// let csrfToken: string | null = null;
// let csrfPromise: Promise<string> | null = null;

// export const fetchCsrfToken = async (force = false): Promise<string> => {
//   if (csrfPromise && !force) return csrfPromise;

//   csrfPromise = (async () => {
//     try {
//       console.log("🔄 [CSRF] Starting double fetch...");

//       // === FETCH 1: Trigger session creation ===
//       try {
//         await fetch("/api/csrf", {
//           credentials: "include",
//           cache: "no-cache",
//         });
//       } catch (error) {
//         console.log("⚠️ First fetch failed, continuing...");
//       }

//       // === WAIT for cookie sync ===
//       await new Promise((resolve) => setTimeout(resolve, 600));

//       // === FETCH 2: Get valid token ===
//       const response = await fetch("/api/csrf", {
//         credentials: "include",
//         cache: "no-cache",
//       });

//       if (!response.ok) {
//         throw new Error(`CSRF fetch failed: ${response.status}`);
//       }

//       const data = await response.json();

//       if (!data.csrfToken) {
//         throw new Error("No CSRF token received");
//       }

//       csrfToken = data.csrfToken;
//       console.log("✅ [CSRF] Token obtained successfully");
//       return csrfToken;
//     } catch (error) {
//       csrfToken = null;
//       throw error;
//     } finally {
//       csrfPromise = null;
//     }
//   })();

//   return csrfPromise;
// };

// export const initializeCsrfToken = async (): Promise<void> => {
//   try {
//     await fetchCsrfToken();
//   } catch (error) {
//     // Silent fail - will retry on demand
//   }
// };

// export const resetCsrfToken = (): void => {
//   csrfToken = null;
//   csrfPromise = null;
// };

// export const getCsrfToken = async (force = false): Promise<string | null> => {
//   if (force || !csrfToken) {
//     try {
//       return await fetchCsrfToken(force);
//     } catch {
//       return null;
//     }
//   }
//   return csrfToken;
// };

// lib/axios.ts - Perbaikan type
let csrfToken: string | null = null;
let csrfPromise: Promise<string | null> | null = null;

export const fetchCsrfToken = async (force = false): Promise<string> => {
  if (csrfPromise && !force) {
    const token = await csrfPromise;
    if (!token) {
      throw new Error('CSRF token is null');
    }
    return token;
  }

  csrfPromise = (async (): Promise<string | null> => {
    try {
      console.log("🔄 [CSRF] Starting double fetch...");

      // === FETCH 1: Trigger session creation ===
      try {
        await fetch("/api/csrf", {
          credentials: "include",
          cache: "no-cache",
        });
      } catch (error) {
        console.log("⚠️ First fetch failed, continuing...");
      }

      // === WAIT for cookie sync ===
      await new Promise((resolve) => setTimeout(resolve, 600));

      // === FETCH 2: Get valid token ===
      const response = await fetch("/api/csrf", {
        credentials: "include",
        cache: "no-cache",
      });

      if (!response.ok) {
        console.error(`❌ [CSRF] Fetch failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.csrfToken) {
        console.error("❌ [CSRF] No token in response");
        return null;
      }

      csrfToken = data.csrfToken;
      console.log("✅ [CSRF] Token obtained successfully");
      return csrfToken;
    } catch (error) {
      csrfToken = null;
      console.error("❌ [CSRF] Error:", error);
      return null;
    } finally {
      csrfPromise = null;
    }
  })();

  const token = await csrfPromise;
  if (!token) {
    throw new Error('Failed to fetch CSRF token');
  }
  return token;
};

export const initializeCsrfToken = async (): Promise<void> => {
  try {
    await fetchCsrfToken();
  } catch (error) {
    // Silent fail - will retry on demand
    console.warn("⚠️ [CSRF] Initialization failed:", error);
  }
};

export const resetCsrfToken = (): void => {
  csrfToken = null;
  csrfPromise = null;
};

export const getCsrfToken = async (force = false): Promise<string | null> => {
  try {
    if (force || !csrfToken) {
      return await fetchCsrfToken(force);
    }
    return csrfToken;
  } catch (error) {
    console.error("❌ [CSRF] Get token failed:", error);
    return null;
  }
};