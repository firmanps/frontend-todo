import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://todo.firmanps.com/api";

const AUTH_PATH = "/auth";
const DASHBOARD_PATH = "/dashboard";

function isPrivatePath(pathname: string) {
  // Cek path yang memerlukan authentication
  return pathname.startsWith("/dashboard") || pathname.startsWith("/profile");
}

function isAuthPath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lewati assets dan API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/icon")
  ) {
    return NextResponse.next();
  }

  const needAuth = isPrivatePath(pathname);
  const inAuthPage = isAuthPath(pathname);

  // Jika bukan private path dan bukan auth page, lanjutkan
  if (!needAuth && !inAuthPage) {
    return NextResponse.next();
  }

  // Validasi login: cek access_token dengan hit endpoint /v1/user/me
  // Backend akan cek access_token dari cookies (httpOnly) dan validasi di DB berdasarkan sub
  // Forward cookies dari request ke backend API
  const cookieHeader = req.headers.get("cookie") ?? "";

  let isLoggedIn = false;
  try {
    // Validasi user dengan endpoint /v1/user/me
    // Endpoint ini akan cek access_token dari cookies dan validasi di DB
    // Jika valid (ada di DB) → return 200 dengan data user
    // Jika tidak valid/tidak ada → return 401/403 unauthorized
    const meRes = await fetch(`${API_BASE}/v1/user/me`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader, // Forward cookies (access_token httpOnly ikut kebawa)
      },
      cache: "no-store",
    });

    // 200 = logged in (access_token valid dan user ada di DB)
    // 401/403 = not logged in (access_token tidak valid atau tidak ada)
    isLoggedIn = meRes.ok;
  } catch (error) {
    // Jika API down atau error, treat sebagai not logged in
    console.error("Middleware auth check error:", error);
    isLoggedIn = false;
  }

  // Rule 1: Akses private path tapi belum login => redirect ke /auth
  if (needAuth && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = AUTH_PATH;
    url.searchParams.set("next", pathname); // Simpan path yang diminta untuk redirect setelah login
    return NextResponse.redirect(url);
  }

  // Rule 2: Akses /auth tapi sudah login (access_token valid) => redirect ke /dashboard
  if (inAuthPage && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = DASHBOARD_PATH;
    url.search = ""; // Clear query params
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Batasi middleware ke path yang perlu aja biar hemat
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/auth",
    "/auth/:path*",
  ],
};
