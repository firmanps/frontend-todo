"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { EditTodoModal } from "@/components/EditTodoModal";
import { SearchFilter } from "@/components/SearchFilter";
import { Sidebar, SidebarTrigger } from "@/components/Sidebar";
import { TodoFormModal } from "@/components/TodoFormModal";
import { TodoItem } from "@/components/TodoItem";
import { TodoPagination } from "@/components/TodoPagination";
import { Todo, TodoStatus } from "@/types/todo";
import { CheckCircle2, Clock, ListTodo, Trophy } from "lucide-react";

const ITEMS_PER_PAGE = 5;

export default function DashboardPage() {
  const router = useRouter();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<TodoStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/auth");
      return;
    }

    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      const parsed = JSON.parse(savedTodos).map((t: Todo) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        status: t.status || "TODO",
      }));
      setTodos(parsed);
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (title: string, description: string, status: TodoStatus) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title,
      description,
      status,
      completed: status === "SUCCESS",
      createdAt: new Date(),
    };

    setTodos((prev) => [newTodo, ...prev]);
    setCurrentPage(1);
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const editTodo = (
    id: string,
    title: string,
    description: string,
    status: TodoStatus
  ) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title,
              description,
              status,
              completed: status === "SUCCESS",
            }
          : t
      )
    );
  };

  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo);
    setEditModalOpen(true);
  };

  const filteredTodos = useMemo(() => {
    let result = [...todos];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase() ?? "").includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [todos, search, sortOrder, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredTodos.length / ITEMS_PER_PAGE);
  const paginatedTodos = filteredTodos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = todos.length;
    const inProgress = todos.filter((t) => t.status === "IN_PROGRESS").length;
    const success = todos.filter((t) => t.status === "SUCCESS").length;
    return { total, inProgress, success };
  }, [todos]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto max-w-4xl animate-fade-in">
          {/* Header */}
          <div className="mb-8 flex items-start gap-3">
            <SidebarTrigger onClick={() => setSidebarOpen(true)} />
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Kelola tugas harian Anda dengan mudah
              </p>
            </div>
            <TodoFormModal onAdd={addTodo} />
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.total}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Tugas</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.inProgress}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.success}
                  </p>
                  <p className="text-sm text-muted-foreground">Selesai</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mb-6">
            <SearchFilter
              search={search}
              onSearchChange={setSearch}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </div>

          {/* Todo List */}
          <div className="space-y-3">
            {paginatedTodos.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-card py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {search || statusFilter !== "ALL"
                    ? "Tidak ditemukan"
                    : "Belum ada tugas"}
                </h3>
                <p className="text-muted-foreground">
                  {search || statusFilter !== "ALL"
                    ? "Coba filter lain"
                    : "Tambahkan tugas pertama Anda!"}
                </p>
              </div>
            ) : (
              paginatedTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onDelete={deleteTodo}
                  onEdit={handleEditClick}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          <TodoPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />

          {/* Edit Modal */}
          <EditTodoModal
            todo={editingTodo}
            open={editModalOpen}
            onOpenChange={(open) => {
              setEditModalOpen(open);
              if (!open) setEditingTodo(null);
            }}
            onSave={editTodo}
          />
        </div>
      </main>
    </div>
  );
}
