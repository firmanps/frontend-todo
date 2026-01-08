"use client";

import { Sidebar, SidebarTrigger } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { getTodoById, updateTodo } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { TodoStatus } from "@/types/todo";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ArrowLeft, Calendar, Edit, Save, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const statusConfig = {
  TODO: { label: "Todo", variant: "secondary" as const },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const },
  COMPLETED: { label: "Completed", variant: "outline" as const },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        const errorMessage = error instanceof Error ? error.message : "Gagal memuat tugas";
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
  const hasChanges = todo ? title.trim() !== todo.title || description.trim() !== (todo.description || "") || status !== todo.status : false;

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
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui tugas";
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

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl animate-fade-in">
            <div className="flex items-center justify-center min-h-100">
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
          <div className="mx-auto max-w-4xl animate-fade-in">
            <div className="text-center py-16">
              <p className="text-muted-foreground">Tugas tidak ditemukan</p>
              <Button onClick={() => router.push("/dashboard")} variant="outline" className="mt-4">
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
        <div className="mx-auto max-w-3xl animate-fade-in">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <SidebarTrigger onClick={() => setSidebarOpen(true)} />
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Detail Tugas</h1>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="shrink-0">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  Batal
                </Button>
                <Button onClick={handleSave} disabled={!title.trim() || isSaving || !hasChanges}>
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Menyimpan...
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
          <div className="bg-card rounded-2xl shadow-medium border border-border/50 p-6 sm:p-8">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Judul
                  </Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masukkan judul tugas..." required className="text-lg" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Deskripsi
                  </Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Masukkan deskripsi tugas (opsional)..." rows={6} className="resize-none" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as TodoStatus)}>
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
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{todo.title}</h2>
                    <Badge
                      variant={config.variant}
                      className={cn("text-xs shrink-0", todo.status === "COMPLETED" && "border-green-200 bg-green-100 text-green-700", todo.status === "IN_PROGRESS" && "border-blue-200 bg-blue-100 text-blue-700")}
                    >
                      {config.label}
                    </Badge>
                  </div>
                </div>

                {todo.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Deskripsi</Label>
                    <p className="text-foreground whitespace-pre-wrap">{todo.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-4 border-t border-border">
                  <Calendar className="h-4 w-4" />
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
    </div>
  );
}
