'use client'

// ============================================================
// My Applications — candidate's own application tracker.
// Data: GET /api/applications (own, ?status= filter),
// GET /api/applications/:id (detail dialog),
// POST /api/applications/:id/withdraw.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  History,
  Info,
  MapPin,
  Undo2,
  Video,
} from 'lucide-react'
import { get, post, ApiError, type Paginated } from '@/lib/api-client'
import { useRouter } from '@/lib/router'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreBar } from '@/components/spa/shared/ScoreBar'
import { ScoreRing } from '@/components/spa/shared/ScoreRing'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { Pagination } from '@/components/spa/shared/Pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/spa/shared/Spinner'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import {
  formatDateTime,
  formatRelativeTime,
  label as formatLabel,
} from '@/components/spa/shared/formatters'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUSES } from '@/lib/constants'

type ApplicationRow = {
  id: string
  status: string
  statusLabel: string
  matchScore: number | null
  appliedAt: string
  updatedAt: string
  job: {
    id: string
    title: string
    location: string
    employmentType: string
    status: string
    department: { id: string; name: string } | null
  }
  resume: { id: string; fileName: string; parseStatus: string } | null
  statusHistory: { id: string }[]
}

type ApplicationDetail = Omit<ApplicationRow, 'job' | 'statusHistory'> & {
  job: ApplicationRow['job'] & { description: string; requiredSkills: string[]; preferredSkills: string[] }
  analysis: {
    id: string
    tfidfScore: number
    skillScore: number
    finalScore: number
    matchedSkills: { skill: string; alias?: string; evidence?: string; required?: boolean }[]
    missingSkills: string[]
    extraSkills: string[]
    summary: string | null
    algorithmVersion: string
  } | null
  statusHistory: {
    id: string
    fromStatus: string | null
    toStatus: string
    actorName: string
    actorRole: string
    note: string | null
    createdAt: string
  }[]
  interviews: {
    id: string
    scheduledAt: string
    mode: string
    locationOrLink: string | null
    notes: string | null
    status: string
  }[]
}

const STATUS_TABS = ['ALL', ...APPLICATION_STATUSES] as const
const PAGE_SIZE = 8
/** Withdraw is blocked for these terminal states (server enforces too). */
const NON_WITHDRAWABLE = new Set(['WITHDRAWN', 'HIRED', 'REJECTED'])

export function MyApplicationsPage() {
  const router = useRouter()
  const reduce = useReducedMotion()

  const [statusTab, setStatusTab] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [apps, setApps] = useState<Paginated<ApplicationRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ApplicationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (statusTab !== 'ALL') params.set('status', statusTab)
      const data = await get<Paginated<ApplicationRow>>(`/api/applications?${params.toString()}`)
      setApps(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [page, statusTab])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    get<ApplicationDetail>(`/api/applications/${id}`)
      .then(setDetail)
      .catch((err) => setDetailError(err instanceof Error ? err.message : 'Failed to load details'))
      .finally(() => setDetailLoading(false))
  }

  const refreshDetail = (id: string) => {
    get<ApplicationDetail>(`/api/applications/${id}`)
      .then(setDetail)
      .catch(() => undefined)
  }

  const handleWithdraw = async (app: ApplicationDetail) => {
    if (NON_WITHDRAWABLE.has(app.status)) return
    const okToWithdraw = await confirmDialog({
      title: 'Withdraw this application?',
      description: `Your application for “${app.job.title}” will be marked as withdrawn. You can re-apply later while the job is open.`,
      confirmText: 'Withdraw application',
      destructive: true,
    })
    if (!okToWithdraw) return

    setWithdrawing(true)
    try {
      await post(`/api/applications/${app.id}/withdraw`)
      toast.success('Application withdrawn.')
      setDetailId(null)
      await load()
      refreshDetail(app.id)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_TRANSITION') {
        toast.error(err.message)
        setDetailId(null)
        await load()
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to withdraw')
      }
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Applications"
        description="Track every application, its AI match snapshot and interview schedule."
      />

      {/* Status filter tabs */}
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filter applications by status"
      >
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={statusTab === s}
            onClick={() => {
              setStatusTab(s)
              setPage(1)
            }}
            className={cn(
              'min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors',
              statusTab === s
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {s === 'ALL' ? 'All' : formatLabel(s)}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <ListSkeleton />
      ) : !apps || apps.items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={statusTab === 'ALL' ? 'No applications yet' : `No ${formatLabel(statusTab).toLowerCase()} applications`}
          description="Browse open roles and apply — the AI scores your resume instantly."
          action={
            <Button className="min-h-11" onClick={() => router.navigate('#/portal/jobs')}>
              Browse Jobs
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {apps.items.map((app, i) => (
              <motion.div
                key={app.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(i * 0.04, 0.2), ease: 'easeOut' }}
              >
                <Card className="card-hover-lift">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(app.id)}
                          className="truncate text-left font-semibold hover:text-primary hover:underline"
                          aria-label={`Open details for ${app.job.title}`}
                        >
                          {app.job.title}
                        </button>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        {app.job.department ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="size-3.5" aria-hidden="true" />
                            {app.job.department.name}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {app.job.location}
                        </span>
                        <span>
                          Applied {formatRelativeTime(app.appliedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <History className="size-3.5" aria-hidden="true" />
                          {Math.max(app.statusHistory.length - 1, 0)} status update
                          {app.statusHistory.length - 1 === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full sm:w-40">
                      <ScoreBar value={app.matchScore} label="AI match" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11 shrink-0 gap-1 sm:min-h-9"
                      onClick={() => openDetail(app.id)}
                      aria-label={`View details of application for ${app.job.title}`}
                    >
                      Details
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <Pagination
            page={apps.page}
            totalPages={apps.totalPages}
            total={apps.total}
            pageSize={apps.pageSize}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Detail dialog */}
      <Dialog open={detailId !== null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detailLoading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground">
              <DialogTitle className="sr-only">Application details</DialogTitle>
              <Spinner className="size-5" />
              Loading application…
            </div>
          ) : detailError ? (
            <div>
              <DialogTitle className="sr-only">Application details</DialogTitle>
              <ErrorState message={detailError} onRetry={() => detailId && openDetail(detailId)} />
            </div>
          ) : detail ? (
            <ApplicationDetailBody
              detail={detail}
              withdrawing={withdrawing}
              onWithdraw={() => void handleWithdraw(detail)}
              onReapply={() => {
                setDetailId(null)
                router.navigate(`#/portal/jobs/${detail.job.id}`)
              }}
              onViewJob={() => {
                setDetailId(null)
                router.navigate(`#/portal/jobs/${detail.job.id}`)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ApplicationDetailBody({
  detail,
  withdrawing,
  onWithdraw,
  onReapply,
  onViewJob,
}: {
  detail: ApplicationDetail
  withdrawing: boolean
  onWithdraw: () => void
  onReapply: () => void
  onViewJob: () => void
}) {
  const canWithdraw = !NON_WITHDRAWABLE.has(detail.status)
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-left">
          {detail.job.title}
          <StatusBadge status={detail.status} />
        </DialogTitle>
        <DialogDescription className="text-left">
          {detail.job.department?.name ? `${detail.job.department.name} · ` : ''}
          {detail.job.location} · {formatLabel(detail.job.employmentType)} · Applied{' '}
          {formatDateTime(detail.appliedAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* Job summary */}
        <section aria-label="Job summary" className="space-y-2">
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{detail.job.description}</p>
          <button
            type="button"
            onClick={onViewJob}
            className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View full job posting
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </button>
        </section>

        <Separator />

        {/* AI snapshot */}
        {detail.analysis ? (
          <section aria-label="AI screening snapshot" className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Info className="size-4 text-primary" aria-hidden="true" />
              AI screening snapshot
            </h3>
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 p-4 sm:flex-row">
              <ScoreRing value={detail.analysis.finalScore} size={84} strokeWidth={8} label="final score" />
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    Skill overlap <span className="font-medium text-foreground">{Math.round((detail.analysis.skillScore ?? 0) * 100)}%</span>
                  </span>
                  <span>
                    Text similarity <span className="font-medium text-foreground">{Math.round(detail.analysis.tfidfScore * 100)}%</span>
                  </span>
                  <span>{detail.analysis.algorithmVersion}</span>
                </div>
                {detail.analysis.summary ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{detail.analysis.summary}</p>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Matched skills ({detail.analysis.matchedSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.analysis.matchedSkills.length === 0 ? (
                    <span className="text-sm text-muted-foreground italic">None matched</span>
                  ) : (
                    detail.analysis.matchedSkills.map((m) => (
                      <Badge
                        key={m.skill}
                        variant="outline"
                        className="border-[var(--success)]/40 bg-[color-mix(in_oklch,var(--success)_12%,transparent)] font-normal text-[var(--success)]"
                        title={m.evidence ? `Evidence: ${m.evidence}` : undefined}
                      >
                        {m.skill}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Missing skills ({detail.analysis.missingSkills.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.analysis.missingSkills.length === 0 ? (
                    <span className="text-sm text-muted-foreground italic">Nothing missing</span>
                  ) : (
                    detail.analysis.missingSkills.map((s) => (
                      <Badge key={s} variant="outline" className="font-normal text-muted-foreground">
                        {s}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Honest note: this score is a decision-support signal for the hiring team — not a hiring
              decision, and never an automatic rejection.
            </p>
          </section>
        ) : (
          <section aria-label="AI screening snapshot">
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              No AI analysis is attached to this application yet. It appears automatically after the
              screening pipeline runs.
            </p>
          </section>
        )}

        {/* Interviews */}
        {detail.interviews.length > 0 ? (
          <section aria-label="Interview schedule" className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Video className="size-4 text-primary" aria-hidden="true" />
              Interviews
            </h3>
            <div className="space-y-2">
              {detail.interviews.map((iv) => (
                <div key={iv.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
                      {formatDateTime(iv.scheduledAt)}
                    </span>
                    <StatusBadge status={iv.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatLabel(iv.mode)}
                    {iv.locationOrLink ? ` · ${iv.locationOrLink}` : ''}
                  </p>
                  {iv.notes ? <p className="mt-1 text-xs text-muted-foreground">{iv.notes}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Status history timeline */}
        <section aria-label="Status history" className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <History className="size-4 text-primary" aria-hidden="true" />
            Status history
          </h3>
          <ol className="relative space-y-4 border-l border-border pl-5">
            {detail.statusHistory.map((h, idx) => (
              <li key={h.id} className="relative">
                <span
                  className={cn(
                    'absolute -left-[26.5px] top-1 size-3.5 rounded-full border-2 border-background',
                    idx === detail.statusHistory.length - 1 ? 'bg-primary' : 'bg-muted-foreground/40',
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={h.toStatus} />
                  {h.fromStatus ? (
                    <span className="text-xs text-muted-foreground">from {formatLabel(h.fromStatus)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">initial state</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(h.createdAt)} · by {h.actorName} ({formatLabel(h.actorRole)})
                  {h.note ? ` — “${h.note}”` : ''}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {detail.status === 'WITHDRAWN' ? (
            <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                You withdrew this application. You can re-apply while the job is open.
              </p>
              <Button size="sm" variant="outline" className="min-h-11 sm:min-h-9" onClick={onReapply}>
                <Undo2 className="size-4" aria-hidden="true" />
                Re-apply
              </Button>
            </div>
          ) : null}
          {canWithdraw ? (
            <Button
              variant="destructive"
              className="min-h-11 gap-1.5"
              onClick={onWithdraw}
              disabled={withdrawing}
              aria-label={`Withdraw application for ${detail.job.title}`}
            >
              {withdrawing ? <Spinner className="size-4" /> : <Undo2 className="size-4" aria-hidden="true" />}
              {withdrawing ? 'Withdrawing…' : 'Withdraw'}
            </Button>
          ) : null}
        </div>
      </div>
    </>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-9 w-full sm:w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}
