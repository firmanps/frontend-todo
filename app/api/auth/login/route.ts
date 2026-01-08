import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL ?? "https://todo.firmanps.com";

  try {
    // Ambil body mentah (biar gak crash kalau backend balikin error/non-json)
    const bodyText = await req.text();

    // Forward cookie header mentah dari client
    const cookieHeader = req.headers.get("cookie") ?? "";

    // Ambil CSRF token (case-insensitive)
    const csrfToken =
      req.headers.get("x-csrf-token") ?? req.headers.get("X-CSRF-Token") ?? "";

    const upstream = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      },
      body: bodyText || "{}", // jaga-jaga empty body
      cache: "no-store",
    });

    // Ambil body upstream sebagai text dulu (anti-crash)
    const upstreamText = await upstream.text();

    // Build response ke client (status sama persis)
    const res = new NextResponse(upstreamText, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });

    // Forward semua Set-Cookie dari backend ke browser (PENTING untuk access_token)
    // Catatan: di beberapa runtime, set-cookie bisa multiple.
    // Kita coba ambil dengan getSetCookie() kalau ada, fallback ke get("set-cookie")
    const anyHeaders: any = upstream.headers as any;

    if (typeof anyHeaders.getSetCookie === "function") {
      const cookies = anyHeaders.getSetCookie() as string[];
      cookies.forEach((c: string) => res.headers.append("set-cookie", c));
    } else {
      const sc = upstream.headers.get("set-cookie");
      if (sc) res.headers.set("set-cookie", sc);
    }

    return res;
  } catch (err: any) {
    console.error("Login proxy failed:", err);
    return NextResponse.json(
      { error: "Login proxy failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
