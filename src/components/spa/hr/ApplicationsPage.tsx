'use client'

// ============================================================
// HR — Applications list (pipeline inbox).
// Data: GET /api/applications?jobId=&status=&search=&page…
// Optional job filter from GET /api/jobs?status=ALL.
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ClipboardList } from 'lucide-react'

import { get } from '@/lib/api-client'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/spa/shared/DataTable'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreBar } from '@/components/spa/shared/ScoreBar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatRelativeTime, label } from '@/components/spa/shared/formatters'

type AppRow = {
  id: string
  status: string
  statusLabel?: string
  matchScore: number | null
  appliedAt: string
  job: { id: string; title: string; location?: string; department?: { id: string; name: string } | null }
  candidate: { name: string; email: string }
  resume: { id: string; parseStatus: string } | null
  analysis: { id: string } | null
}

type JobOption = { id: string; title: string; status: string }

export function ApplicationsPage(_props: unknown) {
  const [items, setItems] = React.useState<AppRow[]>([])
  const [jobs, setJobs] = React.useState<JobOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 12

  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [jobId, setJobId] = React.useState('ALL')
  const [status, setStatus] = React.useState('ALL')
  const reduce = useReducedMotion()

  React.useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await get<{ items: JobOption[] }>('/api/jobs?status=ALL&pageSize=100')
        setJobs(data.items)
      } catch {
        // filter is optional
      }
    }
    void loadJobs()
  }, [])

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
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search) params.set('search', search)
      if (jobId !== 'ALL') params.set('jobId', jobId)
      if (status !== 'ALL') params.set('status', status)
      const data = await get<{ items: AppRow[]; total: number; totalPages: number }>(
        `/api/applications?${params.toString()}`,
      )
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [page, search, jobId, status])

  React.useEffect(() => {
    void load()
  }, [load])

  const columns: DataTableColumn<AppRow>[] = [
    {
      key: 'candidate',
      header: 'Candidate',
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.candidate.name}</p>
          <p className="truncate text-xs text-muted-foreground">{a.candidate.email}</p>
        </div>
      ),
    },
    {
      key: 'job',
      header: 'Job',
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate">{a.job.title}</p>
          {a.job.department?.name ? (
            <p className="truncate text-xs text-muted-foreground">{a.job.department.name}</p>
          ) : null}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'matchScore',
      header: 'AI match',
      render: (a) => <ScoreBar value={a.matchScore} className="w-32" />,
    },
    {
      key: 'appliedAt',
      header: 'Applied',
      render: (a) => <span className="whitespace-nowrap text-muted-foreground">{formatRelativeTime(a.appliedAt)}</span>,
    },
    {
      key: 'ai',
      header: 'Screening',
      hideOnMobile: true,
      render: (a) => (
        <span className="text-xs text-muted-foreground">
          {a.analysis ? 'AI scored' : a.resume?.parseStatus === 'FAILED' ? 'Parse failed' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (a) => (
        <Button asChild variant="ghost" size="sm" className="h-8" aria-label={`Open screening for ${a.candidate.name}`}>
          <a href={`#/hr/applications/${a.id}`}>View</a>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Every candidate submission across all jobs. Open one for evidence-backed AI screening."
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <DataTable<AppRow>
          columns={columns}
          items={items}
          rowKey={(a) => a.id}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No applications found"
          emptyDescription="Adjust the filters, or wait for candidates to apply."
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search candidate or job…"
          toolbar={
            <>
              <Select
                value={jobId}
                onValueChange={(v) => {
                  setJobId(v)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-48" aria-label="Filter by job">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="ALL">All jobs</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-44" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
      </motion.div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ClipboardList className="size-3.5" aria-hidden="true" />
        Click “View” to open the AI screening workspace — scores are decision-support signals only.
      </p>
    </div>
  )
}
