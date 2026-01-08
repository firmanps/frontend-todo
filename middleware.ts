// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PATH = "/auth";
const DASHBOARD_PATH = "/dashboard";

function isPrivatePath(pathname: string) {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/profile");
}
function isAuthPath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  if (!needAuth && !inAuthPage) return NextResponse.next();

  const cookieHeader = req.headers.get("cookie") ?? "";

  let isLoggedIn = false;
  try {
    // ✅ cek ke Next API (proxy), bukan ke backend langsung
    const meRes = await fetch(new URL("/api/user/me", req.url), {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    isLoggedIn = meRes.ok;
  } catch (err) {
    console.error("Middleware auth check error:", err);
    isLoggedIn = false;
  }

  if (needAuth && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = AUTH_PATH;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (inAuthPage && isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = DASHBOARD_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/auth/:path*"],
};
