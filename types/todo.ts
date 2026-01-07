export type TodoStatus = "TODO" | "IN_PROGRESS" | "SUCCESS";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  completed: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
