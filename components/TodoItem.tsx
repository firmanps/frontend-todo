"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Todo } from "@/types/todo";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Pencil, Trash2 } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
}

const statusConfig = {
  TODO: { label: "Todo", variant: "secondary" as const },
  IN_PROGRESS: { label: "In Progress", variant: "default" as const },
  SUCCESS: { label: "Success", variant: "outline" as const },
};

export function TodoItem({ todo, onDelete, onEdit }: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(todo.id), 300);
  };

  const config = statusConfig[todo.status];

  return (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-soft transition-all hover:shadow-medium",
        isDeleting && "animate-fade-out opacity-0 scale-95",
        todo.status === "SUCCESS" && "opacity-70"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <p
            className={cn(
              "font-medium text-foreground transition-all",
              todo.status === "SUCCESS" && "line-through text-muted-foreground"
            )}
          >
            {todo.title}
          </p>

          <Badge
            variant={config.variant}
            className={cn(
              "text-xs",
              todo.status === "SUCCESS" &&
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
          onClick={() => onEdit(todo)}
          className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
