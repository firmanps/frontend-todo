
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL ?? "https://todo.firmanps.com";

  try {
    const cookieHeader = req.headers.get("cookie") ?? "";

    const upstream = await fetch(`${BACKEND_URL}/api/v1/user/me`, {
      method: "GET",
      headers: {
        accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    const text = await upstream.text();

    const res = new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });

    // forward set-cookie kalau backend ngirim sesuatu
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
    return NextResponse.json(
      { error: "ME proxy failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
