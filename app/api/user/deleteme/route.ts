import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

export async function DELETE(request: NextRequest) {
  try {
    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    // Ambil CSRF token dari header request
    const csrfToken = request.headers.get("X-CSRF-Token");

    const response = await fetch(`${BACKEND_URL}/v1/user/deleteme`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(cookies && { Cookie: cookies }), // Forward cookies (access_token httpOnly ikut kebawa)
        ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Forward CSRF token jika ada
      },
      cache: "no-store",
    });

    const data = await response.json();

    // Forward response dari backend
    const nextResponse = NextResponse.json(data, { status: response.status });

    // Forward Set-Cookie headers dari backend untuk clear cookies (access_token)
    // Backend akan mengirim Set-Cookie dengan expires di masa lalu untuk clear cookie
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieString) => {
        try {
          // Parse cookie string (format: "name=value; Path=/; HttpOnly; SameSite=Lax; Secure; Expires=...")
          const parts = cookieString.split("; ");
          const [nameValue] = parts;
          const equalIndex = nameValue.indexOf("=");
          const name = equalIndex > 0 ? nameValue.substring(0, equalIndex) : nameValue;
          
          if (name) {
            // Parse attributes
            const options: any = {
              expires: new Date(0), // Set expires di masa lalu untuk clear cookie
              path: "/",
            };
            
            for (let i = 1; i < parts.length; i++) {
              const part = parts[i];
              const equalIdx = part.indexOf("=");
              const key = equalIdx > 0 ? part.substring(0, equalIdx) : part;
              const val = equalIdx > 0 ? part.substring(equalIdx + 1) : undefined;
              const lowerKey = key.toLowerCase();
              
              if (lowerKey === "path") {
                options.path = val || "/";
              } else if (lowerKey === "domain") {
                options.domain = val;
              } else if (lowerKey === "httponly") {
                options.httpOnly = true;
              } else if (lowerKey === "secure") {
                options.secure = true;
              } else if (lowerKey === "samesite") {
                const sameSiteValue = val?.toLowerCase() || "lax";
                options.sameSite = sameSiteValue === "strict" ? "strict" : sameSiteValue === "none" ? "none" : "lax";
              }
            }
            
            // Clear cookie di browser dengan set value ke empty string dan expires di masa lalu
            nextResponse.cookies.set(name, "", options);
            console.log(`Cookie cleared: ${name}`);
          }
        } catch (error) {
          console.error(`Error parsing cookie: ${cookieString}`, error);
        }
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Error in /api/user/deleteme proxy:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}

