'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  className,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Optional total item count for the "n items" hint. */
  total?: number
  pageSize?: number
  className?: string
}) {
  const pages = Math.max(1, totalPages)
  const from = total !== undefined && pageSize ? (page - 1) * pageSize + 1 : null
  const to = total !== undefined && pageSize ? Math.min(page * pageSize, total) : null

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {from && to ? `Showing ${from}–${to} of ${total}` : `Page ${page} of ${pages}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="min-h-9 gap-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Prev
        </Button>
        <span className="min-w-16 text-center text-sm text-muted-foreground tabular-nums">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="min-h-9 gap-1"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
