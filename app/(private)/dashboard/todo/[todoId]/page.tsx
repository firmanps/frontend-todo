"use client";

import { Sidebar, SidebarTrigger } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { deleteTodo, getTodoById, updateTodo } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { TodoStatus } from "@/types/todo";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Check,
  Edit,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const statusConfig = {
  TODO: {
    label: "Todo",
    variant: "secondary" as const,
    color: "bg-gray-100",
    border: "border-gray-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "default" as const,
    color: "bg-blue-100",
    border: "border-blue-300",
  },
  COMPLETED: {
    label: "Completed",
    variant: "outline" as const,
    color: "bg-green-100",
    border: "border-green-300",
  },
};

export default function TodoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const todoId = params.todoId as string;

  const [todo, setTodo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dragStatus, setDragStatus] = useState<TodoStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoStatus>("TODO");

  // Fetch todo on mount
  useEffect(() => {
    if (!isAuthenticated || authLoading || !todoId) return;

    const fetchTodo = async () => {
      setIsLoading(true);
      try {
        const data = await getTodoById(todoId);
        setTodo(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(data.status);
      } catch (error) {
        console.error("Error fetching todo:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Gagal memuat tugas";
        toast.error(errorMessage);
        // Redirect to dashboard on error
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodo();
  }, [todoId, isAuthenticated, authLoading, router]);

  // Check if there are changes
  const hasChanges = todo
    ? title.trim() !== todo.title ||
      description.trim() !== (todo.description || "") ||
      status !== todo.status
    : false;

  const handleSave = async () => {
    if (!todo || !hasChanges) {
      setIsEditing(false);
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Judul wajib diisi");
      return;
    }

    setIsSaving(true);

    try {
      // Build payload with only changed fields
      const payload: {
        title?: string;
        description?: string;
        status?: TodoStatus;
      } = {};

      if (trimmedTitle !== todo.title) {
        payload.title = trimmedTitle;
      }

      if (description.trim() !== (todo.description || "")) {
        payload.description = description.trim();
      }

      if (status !== todo.status) {
        payload.status = status;
      }

      // Call API
      const updatedTodo = await updateTodo(todoId, payload);

      // Update local state
      setTodo(updatedTodo);

      // Success
      toast.success("Tugas berhasil diperbarui!");
      setIsEditing(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui tugas";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || "");
      setStatus(todo.status);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTodo(todoId);
      toast.success("Tugas berhasil dihapus!");
      router.push("/dashboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal menghapus tugas";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, newStatus: TodoStatus) => {
    setDragStatus(newStatus);
    e.dataTransfer.setData("text/plain", newStatus);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TodoStatus) => {
    e.preventDefault();
    if (!todo || dragStatus === targetStatus || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updatedTodo = await updateTodo(todoId, { status: targetStatus });
      setTodo(updatedTodo);
      setStatus(targetStatus);
      toast.success(
        `Status berhasil diubah ke "${statusConfig[targetStatus].label}"`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal mengubah status";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(false);
      setDragStatus(null);
    }
  };

  const handleDragEnd = () => {
    setDragStatus(null);
  };

  const handleQuickStatusChange = async (newStatus: TodoStatus) => {
    if (!todo || todo.status === newStatus || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const updatedTodo = await updateTodo(todoId, { status: newStatus });
      setTodo(updatedTodo);
      setStatus(newStatus);
      toast.success(
        `Status berhasil diubah ke "${statusConfig[newStatus].label}"`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal mengubah status";
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-3xl animate-fade-in">
            <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Memuat...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-3xl animate-fade-in">
            <div className="text-center py-16">
              <p className="text-muted-foreground">Tugas tidak ditemukan</p>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="mt-4"
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const config = statusConfig[(todo.status as TodoStatus) || "TODO"];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-3xl animate-fade-in">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SidebarTrigger onClick={() => setSidebarOpen(true)} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                Detail Tugas
              </h1>
            </div>

            {!isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none"
                  size="sm"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="flex-1 sm:flex-none"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!title.trim() || isSaving || !hasChanges}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span className="hidden sm:inline">Menyimpan...</span>
                      <span className="sm:hidden">Simpan</span>
                    </span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Content Card */}
          <div className="bg-card rounded-xl sm:rounded-2xl shadow-medium border border-border/50 p-4 sm:p-6 lg:p-8">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Judul
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan judul tugas..."
                    required
                    className="text-base sm:text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Deskripsi
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan deskripsi tugas (opsional)..."
                    rows={4}
                    className="resize-none min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as TodoStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">Todo</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground wrap-break-word">
                      {todo.title}
                    </h2>
                    <Badge
                      variant={config.variant}
                      className={cn(
                        "text-xs sm:text-sm shrink-0 w-fit mt-1 sm:mt-0",
                        todo.status === "COMPLETED" &&
                          "border-green-200 bg-green-100 text-green-700",
                        todo.status === "IN_PROGRESS" &&
                          "border-blue-200 bg-blue-100 text-blue-700"
                      )}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </div>

                {todo.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Deskripsi
                    </Label>
                    <p className="text-foreground whitespace-pre-wrap wrap-break-word text-sm sm:text-base">
                      {todo.description}
                    </p>
                  </div>
                )}

                {/* Drag and Drop Status Section - GitHub Style */}
                <div className="pt-6 border-t border-border">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Ubah Status dengan Drag & Drop
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag kartu ke kolom status yang diinginkan, atau klik
                      tombol status di bawah
                    </p>
                  </div>

                  {/* Drag and Drop Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {(Object.keys(statusConfig) as TodoStatus[]).map(
                      (statusKey) => {
                        const statusConfigItem = statusConfig[statusKey];
                        const isCurrentStatus = todo.status === statusKey;
                        const isDragOver = dragStatus === statusKey;

                        return (
                          <div
                            key={statusKey}
                            className={cn(
                              "relative rounded-lg border-2 p-4 min-h-[120px] transition-all duration-200",
                              statusConfigItem.border,
                              statusConfigItem.color,
                              isDragOver && "ring-2 ring-primary ring-offset-2",
                              isCurrentStatus && "ring-1 ring-primary"
                            )}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, statusKey)}
                            onDragLeave={handleDragEnd}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-foreground">
                                  {statusConfigItem.label}
                                </div>
                                {isCurrentStatus && (
                                  <Badge variant="outline" className="text-xs">
                                    Aktif
                                  </Badge>
                                )}
                              </div>
                              {isCurrentStatus && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                            </div>

                            {/* Draggable Card */}
                            <div
                              draggable
                              className={cn(
                                "cursor-move select-none rounded-lg border bg-white p-3 shadow-sm transition-transform hover:shadow-md active:scale-95",
                                isCurrentStatus
                                  ? "border-primary"
                                  : "border-border opacity-60"
                              )}
                              onDragStart={(e) => handleDragStart(e, statusKey)}
                              onDragEnd={handleDragEnd}
                            >
                              <div className="font-medium text-sm truncate">
                                {todo.title}
                              </div>
                              {todo.description && (
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                  {todo.description.substring(0, 50)}
                                  {todo.description.length > 50 && "..."}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-2 flex justify-between items-center">
                                <span>Drag untuk pindah</span>
                                {isCurrentStatus && (
                                  <span className="text-primary">●</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {isUpdatingStatus && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Mengubah status...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground pt-4 border-t border-border">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    Dibuat:{" "}
                    {format(todo.createdAt, "d MMM yyyy, HH:mm", {
                      locale: id,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-foreground">{todo.title}</h3>
              {todo.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {todo.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={config.variant}
                  className={cn(
                    "text-xs",
                    todo.status === "COMPLETED" &&
                      "border-green-200 bg-green-100 text-green-700",
                    todo.status === "IN_PROGRESS" &&
                      "border-blue-200 bg-blue-100 text-blue-700"
                  )}
                >
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(todo.createdAt, "d MMM yyyy", { locale: id })}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-none"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menghapus...
                </span>
              ) : (
                "Hapus Tugas"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
