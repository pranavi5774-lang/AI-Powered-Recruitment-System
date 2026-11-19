'use client'

// ============================================================
// HR Dashboard — recruitment-focused overview.
// Data: /api/dashboard/stats + /charts + /api/leaves/requests?status=PENDING
// ============================================================

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Briefcase,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  RefreshCw,
  ThumbsUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { get, patch } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatCard } from '@/components/spa/shared/StatCard'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreBar } from '@/components/spa/shared/ScoreBar'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonCards, SkeletonRows } from '@/components/spa/shared/Loading'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AttendanceBarChart, FunnelChart, TrendAreaChart, type AttendanceDatum, type FunnelDatum, type TrendDatum } from '@/components/spa/shared/charts'
import { formatRelativeTime, formatShortDateTime, label } from '@/components/spa/shared/formatters'
import { cn } from '@/lib/utils'

type DashboardStats = {
  totalEmployees: number
  activeJobs: number
  totalCandidates: number
  totalApplications: number
  shortlisted: number
  interviewsScheduled: number
  hired: number
  pendingLeaves: number
}

type DashboardCharts = {
  funnel: FunnelDatum[]
  applicationTrends: TrendDatum[]
  departmentWise: { name: string; count: number }[]
  attendanceOverview: AttendanceDatum[]
  recentApplications: {
    id: string
    candidateName: string
    jobTitle: string
    status: string
    statusLabel: string
    matchScore: number | null
    appliedAt: string
  }[]
}

type PendingLeave = {
  id: string
  employee: { id: string; name: string; employeeCode: string }
  leaveType: { id: string; name: string }
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  createdAt: string
}

const QUICK_ACTIONS = [
  { href: '#/hr/jobs/new', icon: Briefcase, label: 'Post Job', description: 'Create a new opening' },
  { href: '#/hr/applications', icon: ClipboardList, label: 'Review Applications', description: 'AI-assisted screening' },
  { href: '#/hr/leaves', icon: CalendarDays, label: 'Approve Leaves', description: 'Pending requests' },
  { href: '#/hr/attendance', icon: CalendarCheck2, label: 'Mark Attendance', description: 'Daily attendance' },
]

export function HrDashboard(_props: unknown) {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [charts, setCharts] = React.useState<DashboardCharts | null>(null)
  const [pendingLeaves, setPendingLeaves] = React.useState<PendingLeave[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deciding, setDeciding] = React.useState<string | null>(null)
  const reduce = useReducedMotion()

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, c, leaves] = await Promise.all([
        get<DashboardStats>('/api/dashboard/stats'),
        get<DashboardCharts>('/api/dashboard/charts'),
        get<{ items: PendingLeave[] }>('/api/leaves/requests?status=PENDING&pageSize=5'),
      ])
      setStats(s)
      setCharts(c)
      setPendingLeaves(leaves.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const decide = async (leave: PendingLeave, status: 'APPROVED' | 'REJECTED') => {
    const okToGo = await confirmDialog({
      title: status === 'APPROVED' ? 'Approve leave request?' : 'Reject leave request?',
      description: `${leave.employee.name} — ${leave.leaveType.name}, ${leave.days} day${leave.days === 1 ? '' : 's'}.`,
      confirmText: status === 'APPROVED' ? 'Approve' : 'Reject',
      destructive: status === 'REJECTED',
    })
    if (!okToGo) return
    setDeciding(leave.id)
    try {
      await patch(`/api/leaves/requests/${leave.id}`, { status })
      toast.success(`Leave ${status === 'APPROVED' ? 'approved' : 'rejected'} — ${leave.employee.name} has been notified.`)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the leave request')
    } finally {
      setDeciding(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Dashboard"
        description="Pipeline health, hiring activity, attendance and approvals at a glance."
        actions={
          <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState title="Could not load the dashboard" message={error} onRetry={() => void load()} />
      ) : loading ? (
        <div className="space-y-6" role="status" aria-live="polite">
          <SkeletonCards count={4} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
          <span className="sr-only">Loading dashboard</span>
        </div>
      ) : (
        <>
          {/* ---- Quick actions ---- */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {QUICK_ACTIONS.map((a, i) => (
              <motion.div
                key={a.href}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  href={a.href}
                  className="card-hover-lift group flex items-center gap-3 rounded-xl border bg-card p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <a.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:text-primary">{a.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.description}</span>
                  </span>
                  {a.label === 'Approve Leaves' && (stats?.pendingLeaves ?? 0) > 0 ? (
                    <span className="ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-[var(--warning)]">
                      {stats?.pendingLeaves}
                    </span>
                  ) : null}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* ---- KPI cards ---- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={Briefcase} label="Active jobs" value={stats?.activeJobs ?? '—'} hint="Open postings" index={0} />
            <StatCard icon={ClipboardList} label="Applications" value={stats?.totalApplications ?? '—'} hint="Total submissions" index={1} />
            <StatCard icon={Users} label="Shortlisted" value={stats?.shortlisted ?? '—'} hint="Currently shortlisted" index={2} />
            <StatCard icon={UserCheck} label="Interviews" value={stats?.interviewsScheduled ?? '—'} hint="Scheduled & upcoming" index={3} />
            <StatCard icon={CalendarDays} label="Pending leaves" value={stats?.pendingLeaves ?? '—'} hint="Awaiting your decision" index={4} />
          </div>

          {/* ---- Charts ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="rounded-xl border bg-card p-4 sm:p-6"
            >
              <FunnelChart data={charts?.funnel ?? []} height={260} />
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="rounded-xl border bg-card p-4 sm:p-6"
            >
              <TrendAreaChart data={charts?.applicationTrends ?? []} height={260} />
              <p className="mt-2 text-xs text-muted-foreground">Daily applications over the last 14 days (server-provided window).</p>
            </motion.div>
          </div>

          {/* ---- Attendance + pending leaves + recent applications ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="rounded-xl border bg-card p-4 sm:p-6"
            >
              <AttendanceBarChart data={charts?.attendanceOverview ?? []} height={230} />
              <div className="mt-3">
                <Link href="#/hr/attendance" className="text-sm text-primary underline-offset-4 hover:underline">
                  Manage attendance →
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <Card className="h-full py-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    Pending leave approvals
                    {pendingLeaves.length > 0 ? (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-[var(--warning)]">
                        {pendingLeaves.length}
                      </span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingLeaves.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">🎉 No pending requests — you are all caught up.</p>
                  ) : (
                    <ul className="space-y-3">
                      {pendingLeaves.map((l) => (
                        <li key={l.id} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{l.employee.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {l.leaveType.name} • {l.days} day{l.days === 1 ? '' : 's'} • {formatRelativeTime(l.createdAt)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button
                                size="icon"
                                className="size-8"
                                onClick={() => void decide(l, 'APPROVED')}
                                disabled={deciding === l.id}
                                aria-label={`Approve leave for ${l.employee.name}`}
                              >
                                <ThumbsUp className="size-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => void decide(l, 'REJECTED')}
                                disabled={deciding === l.id}
                                aria-label={`Reject leave for ${l.employee.name}`}
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 border-t pt-3">
                    <Link href="#/hr/leaves" className="text-sm text-primary underline-offset-4 hover:underline">
                      All leave requests →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
            >
              <Card className="h-full py-6">
                <CardHeader>
                  <CardTitle className="text-base">Latest applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {(charts?.recentApplications.length ?? 0) === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No applications yet.</p>
                  ) : (
                    <ul className="max-h-80 space-y-3 overflow-y-auto pr-1 scroll-slim">
                      {(charts?.recentApplications ?? []).map((a) => (
                        <li key={a.id}>
                          <Link
                            href={`#/hr/applications/${a.id}`}
                            className="block rounded-lg border p-3 hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium">{a.candidateName}</p>
                              <StatusBadge status={a.status} label={a.statusLabel} />
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.jobTitle}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <ScoreBar value={a.matchScore} showValue={false} className="flex-1" />
                              <span className="text-[11px] text-muted-foreground">{formatShortDateTime(a.appliedAt)}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <p className="text-xs text-muted-foreground">
            Pipeline roles shown: {label('APPLIED')} → {label('HIRED')}. AI match scores are decision-support signals for HR review.
          </p>
        </>
      )}
    </div>
  )
}
