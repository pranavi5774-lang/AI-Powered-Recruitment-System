'use client'

// ============================================================
// DataTable — generic, controlled, responsive.
// ------------------------------------------------------------
// - Desktop (md+): real <table> with optional sortable headers.
// - Mobile: card-collapse (table hidden, stacked cards rendered).
// - Controlled props: page/pageSize/total/onPageChange, search/onSearchChange.
// - Sort: pass sort + onSortChange; columns flag sortable.
// ============================================================

import * as React from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState, ErrorState } from './EmptyState'
import { Pagination } from './Pagination'
import { SearchInput } from './SearchInput'

export type DataTableColumn<T> = {
  key: string
  header: React.ReactNode
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
  /** Allow wrapping for long values (default: truncate on desktop). */
  wrap?: boolean
  /** Hide this column entirely on mobile card view. */
  hideOnMobile?: boolean
}

export type SortState = { key: string; dir: 'asc' | 'desc' }

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  items: T[]
  rowKey: (item: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  // controlled pagination
  page?: number
  totalPages?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  // controlled search
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  // controlled sort
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  // extra toolbar slot (filters etc.)
  toolbar?: React.ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  items,
  rowKey,
  loading,
  error,
  onRetry,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder,
  sort,
  onSortChange,
  toolbar,
  className,
}: DataTableProps<T>) {
  const hasPagination = onPageChange !== undefined
  const hasToolbar = onSearchChange !== undefined || toolbar

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable || !onSortChange) return
    if (sort?.key === col.key) {
      onSortChange({ key: col.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      onSortChange({ key: col.key, dir: 'asc' })
    }
  }

  const sortIcon = (col: DataTableColumn<T>) => {
    if (!col.sortable) return null
    if (sort?.key === col.key) {
      return sort.dir === 'asc' ? (
        <ArrowUp className="size-3.5" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-3.5" aria-hidden="true" />
      )
    }
    return <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
  }

  const mobileVisibleColumns = columns.filter((c) => !c.hideOnMobile)

  return (
    <div className={cn('space-y-4', className)}>
      {hasToolbar ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange !== undefined ? (
            <SearchInput value={search ?? ''} onChange={onSearchChange} placeholder={searchPlaceholder} />
          ) : (
            <div />
          )}
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}

      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : loading ? (
        <div className="rounded-xl border bg-card p-4" aria-hidden="true">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {columns.map((col) => (
                    <TableHead key={col.key} className={cn('whitespace-nowrap', col.className)}>
                      {col.sortable && onSortChange ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col)}
                          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground"
                          aria-label={`Sort by ${typeof col.header === 'string' ? col.header : col.key}`}
                        >
                          {col.header}
                          {sortIcon(col)}
                        </button>
                      ) : (
                        col.header
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={rowKey(item)}>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(!col.wrap && 'max-w-64 truncate', col.className)}
                      >
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card collapse */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <div key={rowKey(item)} className="rounded-xl border bg-card p-4">
                {mobileVisibleColumns.map((col, idx) => (
                  <div
                    key={col.key}
                    className={cn(
                      'flex items-start justify-between gap-3 py-1.5',
                      idx !== mobileVisibleColumns.length - 1 && 'border-b border-border/60',
                    )}
                  >
                    <span className="shrink-0 text-xs text-muted-foreground">{col.header}</span>
                    <span className="min-w-0 break-words text-right text-sm">
                      {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {hasPagination && !loading && !error && items.length > 0 ? (
        <Pagination
          page={page ?? 1}
          totalPages={totalPages ?? 1}
          onPageChange={onPageChange!}
          total={total}
          pageSize={pageSize}
        />
      ) : null}
    </div>
  )
}
