// "use client";

// import { getCsrfToken, initializeCsrfToken, resetCsrfToken } from "@/lib/axios";
// import { useEffect, useRef, useState } from "react";

// export function CsrfTokenProvider({ children }: { children: React.ReactNode }) {
//   const initializedRef = useRef(false);
//   const [isInitialized, setIsInitialized] = useState(false);

//   useEffect(() => {
//     // Cegah double initialization
//     if (initializedRef.current) return;
//     initializedRef.current = true;

//     console.log("🔧 [CsrfProvider] Mounted in private layout");

//     const initialize = async () => {
//       try {
//         console.log("1️⃣ [CsrfProvider] First initialization");

//         // Step 1: Initial fetch
//         await initializeCsrfToken();

//         // Step 2: Wait 500ms for cookie sync
//         await new Promise((resolve) => setTimeout(resolve, 500));

//         // Step 3: Force refresh untuk token yang valid
//         console.log("2️⃣ [CsrfProvider] Force refresh");
//         resetCsrfToken();
//         await getCsrfToken(true);

//         setIsInitialized(true);
//         console.log("✅ [CsrfProvider] Initialization complete");
//       } catch (error) {
//         console.error("❌ [CsrfProvider] Initialization failed:", error);
//         setIsInitialized(true); // Tetap set true agar UI render
//       }
//     };

//     // Jalankan dengan delay kecil
//     const timer = setTimeout(() => {
//       initialize();
//     }, 100);

//     return () => clearTimeout(timer);
//   }, []);

//   // Tampilkan loading state jika diperlukan
//   if (!isInitialized) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-background">
//         <div className="text-center">
//           <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-sm text-muted-foreground">
//             Preparing your session...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

// components/providers/CsrfTokenProvider.tsx
"use client";

import { useEffect, useRef } from "react";
import { initializeCsrfToken } from "@/lib/axios";

export function CsrfTokenProvider({ children }: { children: React.ReactNode }) {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Cegah double initialization di development
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log("🚀 [CsrfProvider] Initializing at root level");

    const init = async () => {
      try {
        // Double fetch pattern untuk pastikan token valid
        console.log("1️⃣ [CsrfProvider] First fetch");
        await initializeCsrfToken();
        
        // Tunggu untuk cookie sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("✅ [CsrfProvider] Initialization complete");
      } catch (error) {
        console.warn("⚠️ [CsrfProvider] Init failed, will retry on demand:", error);
        // Tidak throw error - biarkan axios handle retry
      }
    };

    // Jalankan dengan delay kecil untuk pastikan browser ready
    setTimeout(() => {
      init();
    }, 100);

  }, []);

  // Langsung render children tanpa loading
  return <>{children}</>;
}