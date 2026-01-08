
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Todo } from "@/types/todo";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { deleteTodo } from "@/lib/api";
import { toast } from "@/lib/toast";

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: string) => void; // callback untuk update UI list
}

const statusConfig = {
  TODO: { label: "Todo", variant: "secondary" as const },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const },
  COMPLETED: { label: "Completed", variant: "outline" as const },
};

export function TodoItem({ todo, onDelete }: TodoItemProps) {
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = () => {
    if (isDeleting) return;
    router.push(`/dashboard/todo/${todo.id}`);
  };

  const openConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTodo(todo.id);
      toast.success("Tugas berhasil dihapus");
      setConfirmOpen(false);

      // update list UI
      onDelete(todo.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus tugas";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const config = statusConfig[todo.status] || statusConfig.TODO;

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-soft transition-all hover:shadow-medium cursor-pointer",
          todo.status === "COMPLETED" && "opacity-70"
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p
              className={cn(
                "font-medium text-foreground transition-all",
                todo.status === "COMPLETED" &&
                  "line-through text-muted-foreground"
              )}
            >
              {todo.title}
            </p>

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
          </div>

          {todo.description && (
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(todo.createdAt, "d MMM yyyy, HH:mm", { locale: id })}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openConfirm}
            disabled={isDeleting}
            className=" transition-opacity opacity-100 bg-destructive/10 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ✅ Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Hapus tugas ini?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak bisa dibatalkan. Tugas <b>{todo.title}</b> akan
              dihapus permanen.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
