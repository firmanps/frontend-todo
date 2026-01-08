import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "https://todo.firmanps.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    // Ambil CSRF token dari header request
    const csrfToken = request.headers.get("X-CSRF-Token");

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
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
    // Parse dan set cookies menggunakan NextResponse.cookies API untuk memastikan flags di-preserve
    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieString) => {
        try {
          const parts = cookieString.split("; ");
          const [nameValue] = parts;
          const [name, ...valueParts] = nameValue.split("=");
          const value = valueParts.join("=");

          if (name && value !== undefined) {
            const options: any = {};

            for (let i = 1; i < parts.length; i++) {
              const part = parts[i].trim();
              const equalIndex = part.indexOf("=");
              const key =
                equalIndex > 0
                  ? part.substring(0, equalIndex).trim()
                  : part.trim();
              const val =
                equalIndex > 0
                  ? part.substring(equalIndex + 1).trim()
                  : undefined;
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
              } else if (lowerKey === "httponly" || lowerKey === "http-only") {
                options.httpOnly = true;
              } else if (lowerKey === "secure") {
                options.secure = true;
              } else if (lowerKey === "samesite") {
                const sameSiteValue = val?.toLowerCase() || "lax";
                options.sameSite =
                  sameSiteValue === "strict"
                    ? "strict"
                    : sameSiteValue === "none"
                    ? "none"
                    : "lax";
              }
            }

            // Ensure httpOnly for access_token
            if (
              name.toLowerCase().includes("access_token") ||
              name.toLowerCase().includes("access-token")
            ) {
              options.httpOnly = true;
            }

            nextResponse.cookies.set(name, value, options);
          }
        } catch (error) {
          console.error(`Error parsing cookie: ${cookieString}`, error);
        }
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Error in register proxy:", error);
    return NextResponse.json(
      { error: "Failed to process register request" },
      { status: 500 }
    );
  }
}
