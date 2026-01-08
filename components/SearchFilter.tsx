"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TodoStatus } from "@/types/todo";
import { ArrowUpDown, Search, X } from "lucide-react";

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;

  sortOrder: "newest" | "oldest";
  onSortChange: (value: "newest" | "oldest") => void;

  statusFilter: TodoStatus | "ALL";
  onStatusFilterChange: (value: TodoStatus | "ALL") => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  sortOrder,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
}: SearchFilterProps) {
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari tugas..."
          className="pl-10 pr-10"
          autoComplete="off"
          inputMode="search"
        />

        {hasSearch && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status */}
      <Select
        value={statusFilter}
        onValueChange={(value) =>
          onStatusFilterChange(value as TodoStatus | "ALL")
        }
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Status</SelectItem>
          <SelectItem value="TODO">Todo</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort */}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onSortChange(sortOrder === "newest" ? "oldest" : "newest")
        }
        className="w-full sm:w-auto"
      >
        <ArrowUpDown className="mr-2 h-4 w-4" />
        {sortOrder === "newest" ? "Terbaru" : "Terlama"}
      </Button>
    </div>
  );
}
