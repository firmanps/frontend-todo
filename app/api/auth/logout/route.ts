import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

export async function POST(request: NextRequest) {
  try {
    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    // Ambil CSRF token dari header request
    const csrfToken = request.headers.get("X-CSRF-Token");

    const response = await fetch(`${BACKEND_URL}/v1/auth/logout`, {
      method: "POST",
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

    // Clear cookies jika backend mengirim Set-Cookie untuk clear
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach((cookieString) => {
        try {
          const parts = cookieString.split("; ");
          const [nameValue] = parts;
          const equalIndex = nameValue.indexOf("=");
          const name = equalIndex > 0 ? nameValue.substring(0, equalIndex) : nameValue;
          
          if (name) {
            // Clear cookie dengan set expires di masa lalu
            nextResponse.cookies.set(name, "", {
              expires: new Date(0),
              path: "/",
            });
          }
        } catch (error) {
          console.error(`Error parsing cookie: ${cookieString}`, error);
        }
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Error in logout proxy:", error);
    return NextResponse.json(
      { error: "Failed to process logout request" },
      { status: 500 }
    );
  }
}

