export type TodoStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  completed?: boolean;
  createdAt: Date;
}

export interface TodosMeta {
  page: number;
  limit: number;
  totalData: number;
  totalPage: number;
  sort: "asc" | "desc";
  status: TodoStatus | null;
}

export interface TodosResponse {
  meta: TodosMeta;
  data: Todo[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
