import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

export async function GET(request: NextRequest) {
  try {
    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    // Ambil CSRF token dari header request
    const csrfToken = request.headers.get("X-CSRF-Token");

    // Validasi user dengan endpoint /v1/user/me
    const response = await fetch(`${BACKEND_URL}/v1/user/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(cookies && { Cookie: cookies }), // Forward cookies (access_token httpOnly ikut kebawa)
        ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Forward CSRF token jika ada
      },
      cache: "no-store",
    });

    const data = await response.json();

    // Forward response dari backend (termasuk status code)
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in /api/user/me proxy:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
