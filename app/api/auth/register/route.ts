import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    // Ambil CSRF token dari header request
    const csrfToken = request.headers.get("X-CSRF-Token");

    const response = await fetch(`${BACKEND_URL}/v1/auth/register`, {
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

    // Forward cookies dari backend response ke client jika ada
    const responseHeaders = new Headers();
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      responseHeaders.set("set-cookie", setCookieHeader);
    }

    return NextResponse.json(data, { headers: responseHeaders });
  } catch (error) {
    console.error("Error in register proxy:", error);
    return NextResponse.json(
      { error: "Failed to process register request" },
      { status: 500 }
    );
  }
}

