"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

interface TodoFormProps {
  onAdd: (title: string) => void;
}

export function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const value = title.trim();
    if (!value) return;

    onAdd(value);
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tambah tugas baru..."
        className="flex-1"
        aria-label="Judul tugas"
      />

      <Button type="submit" disabled={!title.trim()}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah
      </Button>
    </form>
  );
}
