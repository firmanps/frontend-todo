"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Trash2 } from "lucide-react";
import { useState } from "react";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    window.setTimeout(() => onDelete(todo.id), 250);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-soft transition-all hover:shadow-medium",
        isDeleting && "animate-fade-out scale-95 opacity-0",
        todo.completed && "opacity-70"
      )}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle(todo.id)}
        className={cn(
          "h-5 w-5 rounded-full border-2 transition-all",
          todo.completed && "bg-success border-success animate-check-bounce"
        )}
        aria-label={todo.completed ? "Tandai belum selesai" : "Tandai selesai"}
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-medium text-foreground transition-all",
            todo.completed && "text-muted-foreground line-through"
          )}
        >
          {todo.title}
        </p>

        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {format(todo.createdAt, "d MMM yyyy, HH:mm", { locale: id })}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label="Hapus todo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
