"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, CalendarDays, Clock, Search } from "lucide-react";

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortOrder: "newest" | "oldest";
  onSortChange: (order: "newest" | "oldest") => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  sortOrder,
  onSortChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari tugas..."
          className="pl-10"
          aria-label="Cari tugas"
        />
      </div>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[140px] gap-2">
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "newest" ? "Terbaru" : "Terlama"}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => onSortChange("newest")}
            className="cursor-pointer gap-2"
          >
            <Clock className="h-4 w-4" />
            Terbaru
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onSortChange("oldest")}
            className="cursor-pointer gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            Terlama
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
