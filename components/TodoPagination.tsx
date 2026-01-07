"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TodoPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TodoPagination({
  currentPage,
  totalPages,
  onPageChange,
}: TodoPaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");

    pages.push(totalPages);

    // remove duplicate (misal currentPage dekat ujung)
    return pages.filter((p, idx) => pages.indexOf(p) === idx);
  };

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => canPrev && onPageChange(currentPage - 1)}
            className={
              canPrev ? "cursor-pointer" : "pointer-events-none opacity-50"
            }
          />
        </PaginationItem>

        {getVisiblePages().map((page, index) => (
          <PaginationItem key={`${page}-${index}`}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => canNext && onPageChange(currentPage + 1)}
            className={
              canNext ? "cursor-pointer" : "pointer-events-none opacity-50"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
