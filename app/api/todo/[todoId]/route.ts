import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "https://todo.firmanps.com";

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

function getTodoIdFromContext(context: { params: { todoId: string } }) {
  return context?.params?.todoId;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ todoId: string }> }
) {
  try {
    const { todoId } = await context.params;
    if (!todoId) {
      return NextResponse.json(
        { message: "todoId is required" },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    const res = await fetch(`${BACKEND_URL}/api/v1/todo/${todoId}`, {
      method: "GET",
      headers: {
        ...(cookieHeader && { Cookie: cookieHeader }),
        ...(csrfToken && { "X-CSRF-Token": csrfToken }),
      },
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error in /api/todo/[todoId] GET proxy:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ todoId: string }> }
) {
  try {
    const { todoId } = await context.params;
    if (!todoId) {
      return NextResponse.json(
        { message: "todoId is required" },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const csrfToken = request.headers.get("x-csrf-token") ?? "";

    const bodyText = await request.text();
    let body: any = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/todo/${todoId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { Cookie: cookieHeader }),
        ...(csrfToken && { "X-CSRF-Token": csrfToken }),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error in /api/todo/[todoId] PATCH proxy:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

// ✅ PERBAIKAN: DELETE
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ todoId: string }> }
) {
  try {
    const { todoId } = await context.params;
    if (!todoId) {
      return NextResponse.json(
        { message: "todoId is required" },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const csrfToken =
      request.headers.get("x-csrf-token") ??
      request.headers.get("X-CSRF-Token") ??
      "";

    const upstream = await fetch(`${BACKEND_URL}/api/v1/todo/${todoId}`, {
      method: "DELETE",
      headers: {
        accept: "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      },
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
  } catch (error) {
    console.error("Error in /api/todo/[todoId] DELETE proxy:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}
