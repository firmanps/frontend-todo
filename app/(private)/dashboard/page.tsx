"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SearchFilter } from "@/components/SearchFilter";
import { Sidebar, SidebarTrigger } from "@/components/Sidebar";
import { TodoForm } from "@/components/TodoForm";
import { TodoItem } from "@/components/TodoItem";
import type { Todo } from "@/types/todo";

import { CheckCircle2, Clock, ListTodo, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.replace("/login");
      return;
    }

    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      const parsed: Todo[] = JSON.parse(savedTodos).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
      }));
      setTodos(parsed);
    }

    setHydrated(true);
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos, hydrated]);

  const addTodo = (title: string) => {
    setTodos((prev) => [
      { id: crypto.randomUUID(), title, completed: false, createdAt: new Date() },
      ...prev,
    ]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTodos = useMemo(() => {
    let result = [...todos];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const aTime = +new Date(a.createdAt);
      const bTime = +new Date(b.createdAt);
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [todos, search, sortOrder]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    return { total, completed, pending: total - completed };
  }, [todos]);

  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Topbar (ALL sizes) */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <SidebarTrigger onClick={() => setSidebarOpen(true)} />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground sm:text-base">
              Dashboard
            </p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              Kelola tugas harian Anda dengan mudah
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-5xl animate-fade-in">
          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:mb-8">
            <StatCard icon={ListTodo} value={stats.total} label="Total Tugas" tone="primary" />
            <StatCard icon={Clock} value={stats.pending} label="Belum Selesai" tone="accent" />
            <StatCard icon={Trophy} value={stats.completed} label="Selesai" tone="success" />
          </div>

          {/* Add Todo */}
          <div className="mb-5 rounded-xl border border-border/50 bg-card p-5 shadow-soft sm:mb-6">
            <TodoForm onAdd={addTodo} />
          </div>

          {/* Search */}
          <div className="mb-5 sm:mb-6">
            <SearchFilter
              search={search}
              onSearchChange={setSearch}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />
          </div>

          {/* Todo List */}
          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-card py-14 text-center sm:py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {search ? "Tidak ditemukan" : "Belum ada tugas"}
                </h3>
                <p className="text-muted-foreground">
                  {search ? "Coba kata kunci lain" : "Tambahkan tugas pertama Anda!"}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: any;
  value: number;
  label: string;
  tone: "primary" | "accent" | "success";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
  }[tone];

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
