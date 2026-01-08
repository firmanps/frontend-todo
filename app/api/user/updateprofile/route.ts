import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "https://todo.firmanps.com";

export async function PATCH(request: NextRequest) {
  try {
    // Ambil cookies dari request client
    const cookies = request.cookies.toString();

    // Ambil CSRF token dari header request
    const csrfToken = request.headers.get("X-CSRF-Token");

    // Get form data from request
    const formData = await request.formData();

    // Forward form data ke backend
    const response = await fetch(`${BACKEND_URL}/api/v1/user/updateprofile`, {
      method: "PATCH",
      headers: {
        ...(cookies && { Cookie: cookies }), // Forward cookies (access_token httpOnly ikut kebawa)
        ...(csrfToken && { "X-CSRF-Token": csrfToken }), // Forward CSRF token jika ada
        // Jangan set Content-Type, biarkan fetch set otomatis dengan boundary untuk multipart/form-data
      },
      body: formData, // Forward form data langsung
      cache: "no-store",
    });

    const data = await response.json();

    // Forward response dari backend (termasuk status code)
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in /api/user/updateprofile proxy:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
