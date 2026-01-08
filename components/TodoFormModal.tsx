"use client";

import type React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { getCsrfToken } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { TodoStatus } from "@/types/todo";
import { Plus } from "lucide-react";

interface TodoFormModalProps {
  onSuccess?: () => void;
}

export function TodoFormModal({ onSuccess }: TodoFormModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoStatus>("TODO");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("TODO");
  };

  // Map TodoStatus to API status format (backend expects: TODO, IN_PROGRESS, COMPLETED)
  const mapStatusToAPI = (
    status: TodoStatus
  ): "TODO" | "IN_PROGRESS" | "COMPLETED" => {
    // Backend uses uppercase, so return as-is
    return status;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Judul wajib diisi");
      return;
    }

    setIsLoading(true);

    try {
      // Get CSRF token
      const csrfToken = await getCsrfToken();

      // Prepare payload
      const payload = {
        title: trimmedTitle,
        description: description.trim() || "",
        status: mapStatusToAPI(status),
      };

      // POST request to API
      const response = await fetch("/api/todo", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-Token": csrfToken }),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401/403 errors
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            data.message || "Session expired. Please login again."
          );
        }
        throw new Error(data.message || data.error || "Gagal membuat tugas");
      }

      // Success
      toast.success("Tugas berhasil dibuat!");
      resetForm();
      setOpen(false);

      // Call onSuccess callback to refresh todos
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membuat tugas";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tugas
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Tugas Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul tugas..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masukkan deskripsi tugas (opsional)..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
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

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                "Tambah"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
