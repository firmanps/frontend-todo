import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

export async function POST(request: NextRequest) {
  try {
    // Handle empty body atau invalid JSON
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    // Ambil CSRF token dari header request
    const csrfToken = request.headers.get("X-CSRF-Token");

    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookies && { Cookie: cookies }), // Forward cookies jika ada
        ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Forward CSRF token jika ada
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Forward cookies dari backend response ke client
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });
    
    // Forward semua set-cookie headers dari backend ke response
    // Parse dan set cookies menggunakan NextResponse.cookies API
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieString) => {
        try {
          // Parse cookie string (format: "name=value; Path=/; HttpOnly; SameSite=Lax; Secure")
          const parts = cookieString.split("; ");
          const [nameValue] = parts;
          const [name, ...valueParts] = nameValue.split("=");
          const value = valueParts.join("="); // Handle values that contain "="
          
          if (name && value !== undefined) {
            // Parse attributes - IMPORTANT: preserve all flags from backend
            const options: any = {};
            let hasHttpOnly = false;
            
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i].trim();
              const equalIndex = part.indexOf("=");
              const key = equalIndex > 0 ? part.substring(0, equalIndex).trim() : part.trim();
              const val = equalIndex > 0 ? part.substring(equalIndex + 1).trim() : undefined;
              const lowerKey = key.toLowerCase();
              
              if (lowerKey === "path") {
                options.path = val || "/";
              } else if (lowerKey === "domain") {
                options.domain = val;
              } else if (lowerKey === "max-age") {
                options.maxAge = parseInt(val || "0", 10);
              } else if (lowerKey === "expires") {
                if (val) {
                  options.expires = new Date(val);
                }
              } else if (lowerKey === "httponly" || lowerKey === "http-only" || key === "HttpOnly") {
                // Preserve HttpOnly flag - CRITICAL for security
                // Handle both lowercase and mixed case (HttpOnly)
                options.httpOnly = true;
                hasHttpOnly = true;
              } else if (lowerKey === "secure") {
                options.secure = true;
              } else if (lowerKey === "samesite") {
                const sameSiteValue = val?.toLowerCase() || "lax";
                options.sameSite = sameSiteValue === "strict" ? "strict" : sameSiteValue === "none" ? "none" : "lax";
              }
            }
            
            // CRITICAL: For access_token or any auth-related cookie, ensure httpOnly is ALWAYS set
            // This is a security requirement - access tokens must never be accessible via JavaScript
            const cookieNameLower = name.toLowerCase();
            if (
              cookieNameLower.includes("access_token") || 
              cookieNameLower.includes("access-token") ||
              cookieNameLower.includes("token") ||
              cookieNameLower === "access_token"
            ) {
              options.httpOnly = true;
              hasHttpOnly = true;
            }
            
            // Set cookie menggunakan NextResponse.cookies API
            // All flags from backend are preserved
            nextResponse.cookies.set(name, value, options);
            
            // Log untuk debugging (remove in production)
            if (process.env.NODE_ENV === "development") {
              console.log(`Cookie set: ${name} (httpOnly: ${options.httpOnly || false}, secure: ${options.secure || false})`);
            }
          }
        } catch (error) {
          console.error(`Error parsing cookie: ${cookieString}`, error);
        }
      });
    } else {
      console.warn("No Set-Cookie headers found in login response");
    }

    return nextResponse;
  } catch (error) {
    console.error("Error in login proxy:", error);
    return NextResponse.json(
      { error: "Failed to process login request" },
      { status: 500 }
    );
  }
}

