"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SearchFilter } from "@/components/SearchFilter";
import { Sidebar, SidebarTrigger } from "@/components/Sidebar";
import { TodoFormModal } from "@/components/TodoFormModal";
import { TodoItem } from "@/components/TodoItem";
import { TodoPagination } from "@/components/TodoPagination";
import { useAuth } from "@/contexts/AuthContext";
import { getTodos } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Todo, TodoStatus, TodosMeta } from "@/types/todo";
import { CheckCircle2, Clock, ListTodo, Trophy } from "lucide-react";

const ITEMS_PER_PAGE = 8;
const SEARCH_DEBOUNCE_MS = 400;

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<TodoStatus | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<TodosMeta | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isLoadingTodos, setIsLoadingTodos] = useState(false);

  // ✅ stats dari DB
  const [stats, setStats] = useState({
    total: 0, // totalData dari query yang sedang tampil (include search+status)
    inProgress: 0,
    success: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchingTodosRef = useRef(false);
  const fetchingStatsRef = useRef(false);

  const mapStatusFromAPI = (status: string): TodoStatus => {
    if (status === "TODO" || status === "IN_PROGRESS" || status === "COMPLETED")
      return status as TodoStatus;
    return "TODO";
  };

  const getApiSort = () =>
    sortOrder === "newest" ? ("desc" as const) : ("asc" as const);

  // ✅ Debounce search (server-side)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [search]);

  // ✅ Reset page ke 1 kalau filter/search/sort berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, sortOrder]);

  // ✅ Fetch todos (server-side search + filter + pagination)
  const fetchTodos = async () => {
    if (!isAuthenticated) return;
    if (fetchingTodosRef.current) return;

    fetchingTodosRef.current = true;
    setIsLoadingTodos(true);

    try {
      const apiSort = getApiSort();

      const res = await getTodos({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sort: apiSort,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch || undefined, // ✅ all data search
      });

      const list = Array.isArray(res?.data) ? res.data : [];
      const transformed: Todo[] = list.map((item: any) => ({
        id: item.id || item._id || crypto.randomUUID(),
        title: item.title || "",
        description: item.description || "",
        status: mapStatusFromAPI(item.status || "TODO"),
        completed: item.status === "COMPLETED" || item.completed || false,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }));

      setTodos(transformed);
      setMeta(res?.meta ?? null);

      // ✅ total card = totalData dari hasil query yg lagi ditampilkan (include search+status)
      setStats((prev) => ({
        ...prev,
        total: res?.meta?.totalData ?? 0,
      }));
    } catch (error) {
      console.error("Error fetching todos:", error);
      if (
        error instanceof Error &&
        !error.message.includes("Session expired")
      ) {
        toast.error("Gagal memuat tugas");
      }
    } finally {
      setIsLoadingTodos(false);
      fetchingTodosRef.current = false;
    }
  };

  // ✅ Fetch stats dari DB (ikut search biar konsisten)
  const fetchStats = async () => {
    if (!isAuthenticated) return;
    if (fetchingStatsRef.current) return;

    fetchingStatsRef.current = true;
    setIsLoadingStats(true);

    try {
      const apiSort = getApiSort();
      const base = {
        page: 1,
        limit: 1,
        sort: apiSort as "asc" | "desc",
        search: debouncedSearch || undefined, // ✅ ikut search
      };

      // inProgress & success = count berdasarkan status
      const [inProgRes, doneRes] = await Promise.all([
        getTodos({ ...base, status: "IN_PROGRESS" }),
        getTodos({ ...base, status: "COMPLETED" }),
      ]);

      setStats((prev) => ({
        total: prev.total, // total sudah dari fetchTodos()
        inProgress: inProgRes?.meta?.totalData ?? 0,
        success: doneRes?.meta?.totalData ?? 0,
      }));
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setIsLoadingStats(false);
      fetchingStatsRef.current = false;
    }
  };

  // Proteksi route
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch list: page / filter / sort / debouncedSearch berubah
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    statusFilter,
    sortOrder,
    debouncedSearch,
    isAuthenticated,
    isLoading,
  ]);

  // Fetch stats: filter / sort / debouncedSearch berubah
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortOrder, debouncedSearch, isAuthenticated, isLoading]);

  // Refetch saat tab balik visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        fetchTodos();
        fetchStats();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const refreshTodos = async () => {
    // kalau bukan page 1, set ke 1 biar konsisten
    if (currentPage !== 1) setCurrentPage(1);
    else {
      await fetchTodos();
      await fetchStats();
    }
  };

  const deleteTodo = (id: string) => {
    // optimistic remove
    setTodos((prev) => prev.filter((t) => t.id !== id));
    // refresh biar akurat
    fetchTodos();
    fetchStats();
  };

  const totalPages = meta?.totalPage ?? 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl animate-fade-in">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <SidebarTrigger onClick={() => setSidebarOpen(true)} />
              <div className="flex-1 sm:flex-initial">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Dashboard
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Kelola tugas harian Anda dengan mudah
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto">
              <TodoFormModal onSuccess={refreshTodos} />
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ListTodo className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {isLoadingTodos ? "…" : stats.total}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Total Tugas
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-[#EBF6F6]">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-[#3FA6A6]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {isLoadingStats ? "…" : stats.inProgress}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    In Progress
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5 shadow-soft sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7]">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-[#16A34A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {isLoadingStats ? "…" : stats.success}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Selesai
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mb-4 sm:mb-6">
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
          <div className="space-y-2 sm:space-y-3">
            {isLoadingTodos ? (
              <div className="rounded-xl border border-border/50 bg-card py-12 sm:py-16 px-4 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Memuat tugas...
                </p>
              </div>
            ) : todos.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-card py-12 sm:py-16 px-4 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-base sm:text-lg font-semibold text-foreground">
                  {debouncedSearch || statusFilter !== "ALL"
                    ? "Tidak ditemukan"
                    : "Belum ada tugas"}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {debouncedSearch || statusFilter !== "ALL"
                    ? "Coba keyword/filter lain"
                    : "Tambahkan tugas pertama Anda!"}
                </p>
              </div>
            ) : (
              todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onDelete={deleteTodo} />
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoadingTodos && totalPages > 0 && (
            <TodoPagination
              currentPage={meta?.page ?? currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </main>
    </div>
  );
}
