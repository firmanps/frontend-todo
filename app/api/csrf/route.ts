import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL ?? "https://todo.firmanps.com";

  try {
    // Ambil cookie header mentah (format valid: "a=b; c=d")
    const cookieHeader = request.headers.get("cookie") ?? "";

    const upstream = await fetch(`${BACKEND_URL}/api/v1/csrf`, {
      method: "GET",
      headers: {
        accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    const bodyText = await upstream.text();

    // Kalau backend error, jangan ditutup-tutupi jadi 500 generik
    if (!upstream.ok) {
      return new NextResponse(bodyText || "Upstream CSRF error", {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") ?? "text/plain",
        },
      });
    }

    // Forward set-cookie (kalau ada)
    const res = new NextResponse(bodyText, {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });

    // Next 16: set-cookie bisa multiple, tapi minimal kita forward yang ada
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (err: any) {
    console.error("CSRF proxy failed:", err);
    return NextResponse.json(
      { error: "CSRF proxy failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
