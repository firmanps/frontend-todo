import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

export async function GET(request: NextRequest) {
  try {
    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    const response = await fetch(`${BACKEND_URL}/v1/csrf`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(cookies && { Cookie: cookies }), // Forward cookies jika ada
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch CSRF token" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Forward cookies dari backend response ke client jika ada
    const responseHeaders = new Headers();
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      responseHeaders.set("set-cookie", setCookieHeader);
    }

    return NextResponse.json(data, { headers: responseHeaders });
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return NextResponse.json(
      { error: "Failed to fetch CSRF token" },
      { status: 500 }
    );
  }
}

