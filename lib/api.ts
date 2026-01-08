import { getCsrfToken } from "@/lib/axios";
import { Todo, TodoStatus, TodosResponse } from "@/types/todo";

export interface GetTodosParams {
  page?: number;
  limit?: number;
  status?: TodoStatus;
  sort?: "asc" | "desc";
  search?: string; // ✅ server-side search (title)
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string;
  status?: TodoStatus;
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { message: text };
  }
}

function normalizeTodo(raw: any, fallbackId: string): Todo {
  const st =
    raw?.status === "TODO" ||
    raw?.status === "IN_PROGRESS" ||
    raw?.status === "COMPLETED"
      ? (raw.status as TodoStatus)
      : "TODO";

  return {
    id: raw?.id || raw?._id || fallbackId,
    title: raw?.title || "",
    description: raw?.description || "",
    status: st,
    completed: st === "COMPLETED" || raw?.completed || false,
    createdAt: raw?.createdAt ? new Date(raw.createdAt) : new Date(),
  };
}

/**
 * GET /api/todo (via Next proxy) — no CSRF needed for GET
 */
export async function getTodos(params?: GetTodosParams): Promise<TodosResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page !== undefined) queryParams.set("page", String(params.page));
  if (params?.limit !== undefined)
    queryParams.set("limit", String(params.limit));

  // status opsional (kalau kosong, backend meta.status = null)
  if (params?.status) queryParams.set("status", params.status);

  if (params?.sort) queryParams.set("sort", params.sort);

  // ✅ search opsional — minimal 2 char biar ga berat di DB
  const s = (params?.search ?? "").trim();
  if (s.length >= 2) queryParams.set("search", s);

  const url = `/api/todo${queryParams.toString() ? `?${queryParams}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(data?.message || "Session expired. Please login again.");
    }
    throw new Error(data?.message || data?.error || "Gagal memuat tugas");
  }

  return data as TodosResponse;
}

/**
 * GET /api/todo/:todoId (via Next proxy) — no CSRF needed for GET
 */
export async function getTodoById(todoId: string): Promise<Todo> {
  const res = await fetch(`/api/todo/${todoId}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(data?.message || "Session expired. Please login again.");
    }
    throw new Error(data?.message || data?.error || "Gagal memuat tugas");
  }

  // backend bisa balikin { data: {...} } atau langsung object
  const rawTodo = data?.data ?? data;
  return normalizeTodo(rawTodo, todoId);
}

/**
 * PATCH /api/todo/:todoId (via Next proxy) — CSRF required
 */
export async function updateTodo(
  todoId: string,
  payload: UpdateTodoPayload
): Promise<Todo> {
  const body: UpdateTodoPayload = {};
  if (payload.title !== undefined) body.title = payload.title;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.status !== undefined) body.status = payload.status;

  const csrfToken = await getCsrfToken().catch(() => "");

  const res = await fetch(`/api/todo/${todoId}`, {
    method: "PATCH",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(data?.message || "Session expired. Please login again.");
    }
    throw new Error(data?.message || data?.error || "Gagal memperbarui tugas");
  }

  const rawTodo = data?.data ?? data;
  return normalizeTodo(rawTodo, todoId);
}
