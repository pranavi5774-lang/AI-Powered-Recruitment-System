'use client'

// ============================================================
// HR — Jobs list.
// Data: GET /api/jobs?status=ALL|DRAFT|OPEN|CLOSED&search=…
// HR/ADMIN see all statuses incl. DRAFT via ?status=ALL.
// Counts for the stat cards come from 4 lightweight
// ?pageSize=1 requests (honest server-side totals).
// ============================================================

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Archive, Briefcase, Eye, Pencil, Plus, Trophy } from 'lucide-react'
import { toast } from 'sonner'

import { get, patch } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatCard } from '@/components/spa/shared/StatCard'
import { DataTable, type DataTableColumn, type SortState } from '@/components/spa/shared/DataTable'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatSalaryRange, label } from '@/components/spa/shared/formatters'
import { useAuthStore } from '@/lib/store'

type JobRow = {
  id: string
  title: string
  location: string
  employmentType: string
  experienceMin: number | null
  status: 'DRAFT' | 'OPEN' | 'CLOSED'
  openings: number | null
  salaryMin: number | null
  salaryMax: number | null
  publishedAt: string | null
  createdAt: string
  department: { id: string; name: string } | null
  _count: { applications: number }
}

type StatusFilter = 'ALL' | 'DRAFT' | 'OPEN' | 'CLOSED'

export function JobsPage(_props: unknown) {
  const me = useAuthStore((s) => s.user)
  const reduce = useReducedMotion()

  const [items, setItems] = React.useState<JobRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 10
  const [status, setStatus] = React.useState<StatusFilter>('ALL')
  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [counts, setCounts] = React.useState<{ open: number; draft: number; closed: number; all: number } | null>(null)
  const [transitioning, setTransitioning] = React.useState<string | null>(null)
  const [sort, setSort] = React.useState<SortState | undefined>(undefined)

  React.useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), status })
      if (search) params.set('search', search)
      const data = await get<{ items: JobRow[]; total: number; totalPages: number }>(`/api/jobs?${params.toString()}`)
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  const loadCounts = React.useCallback(async () => {
    try {
      const [open, draft, closed, all] = await Promise.all([
        get<{ total: number }>('/api/jobs?status=OPEN&pageSize=1'),
        get<{ total: number }>('/api/jobs?status=DRAFT&pageSize=1'),
        get<{ total: number }>('/api/jobs?status=CLOSED&pageSize=1'),
        get<{ total: number }>('/api/jobs?status=ALL&pageSize=1'),
      ])
      setCounts({ open: open.total, draft: draft.total, closed: closed.total, all: all.total })
    } catch {
      // counts are decorative; the table shows its own state
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])
  React.useEffect(() => {
    void loadCounts()
  }, [loadCounts])

  const changeStatus = async (job: JobRow, next: 'OPEN' | 'CLOSED') => {
    const okToGo = await confirmDialog({
      title: next === 'OPEN' ? `Publish “${job.title}”?` : `Close “${job.title}”?`,
      description:
        next === 'OPEN'
          ? 'The job becomes visible to candidates immediately and starts receiving applications.'
          : 'Candidates will no longer be able to apply. The job remains in history.',
      confirmText: next === 'OPEN' ? 'Publish' : 'Close job',
      destructive: next === 'CLOSED',
    })
    if (!okToGo) return
    setTransitioning(job.id)
    try {
      await patch(`/api/jobs/${job.id}`, { status: next })
      toast.success(`Job ${next === 'OPEN' ? 'published' : 'closed'}: ${job.title}`)
      void load()
      void loadCounts()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the job status')
    } finally {
      setTransitioning(null)
    }
  }

  const sortedItems = React.useMemo(() => {
    if (!sort) return items
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      const get = (j: JobRow): string | number | null => {
        switch (sort.key) {
          case 'title':
            return j.title
          case 'status':
            return j.status
          case 'openings':
            return j.openings
          case 'applications':
            return j._count.applications
          case 'publishedAt':
            return j.publishedAt
          default:
            return null
        }
      }
      const av = get(a)
      const bv = get(b)
      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [items, sort])

  const columns: DataTableColumn<JobRow>[] = [
    {
      key: 'title',
      header: 'Job',
      sortable: true,
      render: (j) => (
        <div className="min-w-0">
          <Link href={`#/hr/jobs/${j.id}`} className="truncate font-medium text-foreground hover:text-primary">
            {j.title}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {j.department?.name ?? 'No department'} • {j.location}
          </p>
        </div>
      ),
    },
    {
      key: 'employmentType',
      header: 'Type',
      hideOnMobile: true,
      render: (j) => <Badge variant="outline">{label(j.employmentType)}</Badge>,
    },
    { key: 'status', header: 'Status', sortable: true, render: (j) => <StatusBadge status={j.status} /> },
    {
      key: 'openings',
      header: 'Openings',
      sortable: true,
      render: (j) => <span className="tabular-nums">{j.openings ?? '—'}</span>,
    },
    {
      key: 'applications',
      header: 'Applications',
      sortable: true,
      render: (j) => (
        <Link
          href={`#/hr/jobs/${j.id}`}
          className="tabular-nums text-primary hover:underline"
          aria-label={`${j._count.applications} applications for ${j.title}`}
        >
          {j._count.applications}
        </Link>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      hideOnMobile: true,
      render: (j) => <span className="whitespace-nowrap text-muted-foreground">{formatSalaryRange(j.salaryMin, j.salaryMax)}</span>,
    },
    {
      key: 'publishedAt',
      header: 'Published',
      sortable: true,
      hideOnMobile: true,
      render: (j) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(j.publishedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (j) => (
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="ghost" size="icon" className="size-8" aria-label={`View ${j.title}`}>
            <a href={`#/hr/jobs/${j.id}`}>
              <Eye className="size-4" aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="size-8" aria-label={`Edit ${j.title}`}>
            <a href={`#/hr/jobs/${j.id}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
            </a>
          </Button>
          {j.status === 'DRAFT' ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[var(--success)]"
              onClick={() => void changeStatus(j, 'OPEN')}
              disabled={transitioning === j.id}
            >
              Publish
            </Button>
          ) : null}
          {j.status === 'OPEN' ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => void changeStatus(j, 'CLOSED')}
              disabled={transitioning === j.id}
            >
              <Archive className="size-3.5" aria-hidden="true" />
              Close
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Post, publish and manage openings. Drafts are only visible to HR and Admin."
        actions={
          <Button asChild size="sm" className="min-h-9 gap-1.5">
            <a href="#/hr/jobs/new">
              <Plus className="size-4" aria-hidden="true" />
              Create Job
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Open jobs" value={counts?.open ?? '—'} hint="Accepting applications" index={0} />
        <StatCard icon={Pencil} label="Drafts" value={counts?.draft ?? '—'} hint="Not yet published" index={1} />
        <StatCard icon={Archive} label="Closed" value={counts?.closed ?? '—'} hint="No longer accepting" index={2} />
        <StatCard icon={Trophy} label="Total openings" value={counts?.all ?? '—'} hint="All-time postings" index={3} />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <DataTable<JobRow>
          columns={columns}
          items={sortedItems}
          rowKey={(j) => j.id}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          emptyTitle={search || status !== 'ALL' ? 'No jobs match these filters' : 'No jobs yet'}
          emptyDescription={
            search || status !== 'ALL'
              ? 'Try a different search term or status filter.'
              : 'Post your first opening — candidates can apply as soon as it is published.'
          }
          emptyAction={
            <Button asChild size="sm" variant="outline">
              <a href="#/hr/jobs/new">Create your first job</a>
            </Button>
          }
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by title…"
          sort={sort}
          onSortChange={setSort}
          toolbar={
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as StatusFilter)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" className="w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="DRAFT">{label('DRAFT')}</SelectItem>
                <SelectItem value="OPEN">{label('OPEN')}</SelectItem>
                <SelectItem value="CLOSED">{label('CLOSED')}</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </motion.div>

      <p className="text-xs text-muted-foreground">
        Signed in as {label(me?.role ?? '')} — you can see every job status. Candidates only see OPEN jobs.
      </p>
    </div>
  )
}
