import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL ?? "https://todo.firmanps.com";

  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const csrfToken =
      req.headers.get("x-csrf-token") ?? req.headers.get("X-CSRF-Token") ?? "";

    const upstream = await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      },
      cache: "no-store",
    });

    // logout bisa 204 / kosong -> ambil text, jangan json
    const text = await upstream.text();

    const res = new NextResponse(text || "", {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });

    // Forward semua Set-Cookie dari backend (biasanya clear access_token)
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
    console.error("Logout proxy failed:", err);
    return NextResponse.json(
      { error: "Logout proxy failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
