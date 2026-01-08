import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.BACKEND_URL ?? "https://todo.firmanps.com";

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function forwardSetCookie(upstream: Response, res: NextResponse) {
  const anyHeaders: any = upstream.headers as any;
  if (typeof anyHeaders.getSetCookie === "function") {
    const cookies = anyHeaders.getSetCookie() as string[];
    cookies.forEach((c: string) => res.headers.append("set-cookie", c));
  } else {
    const sc = upstream.headers.get("set-cookie");
    if (sc) res.headers.set("set-cookie", sc);
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const csrfToken =
      req.headers.get("x-csrf-token") ?? req.headers.get("X-CSRF-Token") ?? "";

    // body raw supaya gak crash kalau invalid JSON
    const bodyText = await req.text();

    const upstream = await fetch(`${API_BASE}/api/v1/todo`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      },
      body: bodyText || "{}",
      cache: "no-store",
    });

    const text = await safeText(upstream);

    const res = new NextResponse(text || "", {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });

    forwardSetCookie(upstream, res);
    return res;
  } catch (err: any) {
    console.error("Error in /api/todo POST proxy:", err);
    return NextResponse.json(
      {
        message: "Todo POST proxy failed",
        detail: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";

    // forward query params apa adanya
    const url = new URL(req.url);
    const qs = url.searchParams.toString();

    const upstream = await fetch(
      `${API_BASE}/api/v1/todo${qs ? `?${qs}` : ""}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        cache: "no-store",
      }
    );

    const text = await safeText(upstream);

    const res = new NextResponse(text || "", {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });

    forwardSetCookie(upstream, res);
    return res;
  } catch (err: any) {
    console.error("Error in /api/todo GET proxy:", err);
    return NextResponse.json(
      { message: "Todo GET proxy failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
