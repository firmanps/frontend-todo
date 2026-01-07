"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Todo, TodoStatus } from "@/types/todo";

interface EditTodoModalProps {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    title: string,
    description: string,
    status: TodoStatus
  ) => void;
}

export function EditTodoModal({
  todo,
  open,
  onOpenChange,
  onSave,
}: EditTodoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoStatus>("TODO");

  useEffect(() => {
    if (!todo) return;
    setTitle(todo.title);
    setDescription(todo.description || "");
    setStatus(todo.status);
  }, [todo]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!todo) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onSave(todo.id, trimmedTitle, description.trim(), status);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Tugas</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Judul</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul tugas..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Deskripsi</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi tugas (opsional)..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
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
                <SelectItem value="SUCCESS">Success</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button type="submit" disabled={!title.trim()} className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
