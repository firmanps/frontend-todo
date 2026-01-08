import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://todo.firmanps.com";

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
