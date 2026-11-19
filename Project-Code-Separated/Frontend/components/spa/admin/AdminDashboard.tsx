'use client'

// ============================================================
// Admin Dashboard — org-wide KPIs, pipeline funnel, trends,
// department distribution, recent applications and audit feed.
// Data: GET /api/dashboard/stats + /api/dashboard/charts
// ============================================================

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Briefcase,
  CalendarDays,
  FileText,
  LayoutDashboard,
  RefreshCw,
  ScrollText,
  UserCheck,
  UserRoundSearch,
  Users,
} from 'lucide-react'
import { get } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatCard } from '@/components/spa/shared/StatCard'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreBar } from '@/components/spa/shared/ScoreBar'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonCards, SkeletonRows } from '@/components/spa/shared/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DepartmentPieChart,
  FunnelChart,
  TrendAreaChart,
  type AttendanceDatum,
  type FunnelDatum,
  type SliceDatum,
  type TrendDatum,
} from '@/components/spa/shared/charts'
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
  departmentWise: SliceDatum[]
  attendanceOverview: AttendanceDatum[]
  recentApplications: {
    id: string
    candidateName: string
    jobTitle: string
    jobId: string
    status: string
    statusLabel: string
    matchScore: number | null
    appliedAt: string
  }[]
  recentActivities: {
    id: string
    actorName: string
    actorRole: string
    action: string
    entityType: string
    entityId: string
    createdAt: string
  }[]
}

/** Trend windows we can slice client-side (server returns the last 14 days). */
const TREND_WINDOWS = [7, 14] as const

export function AdminDashboard(_props: unknown) {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [charts, setCharts] = React.useState<DashboardCharts | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [trendWindow, setTrendWindow] = React.useState<(typeof TREND_WINDOWS)[number]>(14)
  const reduce = useReducedMotion()

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, c] = await Promise.all([
        get<DashboardStats>('/api/dashboard/stats'),
        get<DashboardCharts>('/api/dashboard/charts'),
      ])
      setStats(s)
      setCharts(c)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const trendData = React.useMemo(() => {
    if (!charts) return []
    return charts.applicationTrends.slice(-trendWindow)
  }, [charts, trendWindow])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Organization-wide hiring, workforce and platform activity."
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
          <SkeletonCards count={6} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
          <div className="rounded-xl border bg-card p-6">
            <SkeletonRows rows={5} />
          </div>
          <span className="sr-only">Loading dashboard</span>
        </div>
      ) : (
        <>
          {/* ---- KPI cards ---- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard icon={Users} label="Employees" value={stats?.totalEmployees ?? '—'} hint="Employees on record" index={0} />
            <StatCard icon={Briefcase} label="Active jobs" value={stats?.activeJobs ?? '—'} hint="Open postings" index={1} />
            <StatCard icon={UserRoundSearch} label="Candidates" value={stats?.totalCandidates ?? '—'} hint="Registered candidates" index={2} />
            <StatCard icon={FileText} label="Applications" value={stats?.totalApplications ?? '—'} hint="All-time submissions" index={3} />
            <StatCard icon={UserCheck} label="Hired" value={stats?.hired ?? '—'} hint="Applications hired" index={4} />
            <StatCard
              icon={CalendarDays}
              label="Pending leaves"
              value={stats?.pendingLeaves ?? '—'}
              hint="Awaiting approval"
              index={5}
              trend={
                stats && stats.pendingLeaves > 0 ? (
                  <Link
                    href="#/hr/leaves"
                    className="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-[var(--warning)] hover:opacity-90"
                  >
                    Review
                  </Link>
                ) : undefined
              }
            />
          </div>

          {/* ---- Charts ---- */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="rounded-xl border bg-card p-4 sm:p-6"
            >
              <FunnelChart data={charts?.funnel ?? []} height={260} />
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="rounded-xl border bg-card p-4 sm:p-6"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Application trends</p>
                <Select
                  value={String(trendWindow)}
                  onValueChange={(v) => setTrendWindow(Number(v) as (typeof TREND_WINDOWS)[number])}
                >
                  <SelectTrigger size="sm" className="w-32" aria-label="Trend window">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREND_WINDOWS.map((w) => (
                      <SelectItem key={w} value={String(w)}>
                        Last {w} days
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TrendAreaChart data={trendData} title={undefined} height={230} />
              <p className="mt-2 text-xs text-muted-foreground">
                The server provides daily application counts for the most recent 14 days.
              </p>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="rounded-xl border bg-card p-4 sm:p-6"
            >
              <DepartmentPieChart data={charts?.departmentWise ?? []} height={260} />
            </motion.div>
          </div>

          {/* ---- Recent applications + audit feed ---- */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="xl:col-span-2"
            >
              <Card className="py-6">
                <CardHeader>
                  <CardTitle className="text-base">Recent applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {(charts?.recentApplications.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No applications yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Candidate</TableHead>
                            <TableHead>Job</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>AI match</TableHead>
                            <TableHead>Applied</TableHead>
                            <TableHead className="text-right">Screening</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(charts?.recentApplications ?? []).map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.candidateName}</TableCell>
                              <TableCell className="max-w-52 truncate">{a.jobTitle}</TableCell>
                              <TableCell>
                                <StatusBadge status={a.status} label={a.statusLabel} />
                              </TableCell>
                              <TableCell className="w-36">
                                <ScoreBar value={a.matchScore} showValue={false} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {formatShortDateTime(a.appliedAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link
                                  href={`#/hr/applications/${a.id}`}
                                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                  aria-label={`Open screening for ${a.candidateName}`}
                                >
                                  Open
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <Card className="h-full py-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ScrollText className="size-4 text-muted-foreground" aria-hidden="true" />
                    Recent activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(charts?.recentActivities.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No recorded activity yet.</p>
                  ) : (
                    <ol className="space-y-4">
                      {(charts?.recentActivities ?? []).map((act) => (
                        <li key={act.id} className="flex items-start gap-3">
                          <span
                            className="mt-1 size-2 shrink-0 rounded-full bg-primary/70"
                            aria-hidden="true"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm leading-snug">
                              <span className="font-medium">{act.actorName}</span>
                              <span className="text-muted-foreground"> ({label(act.actorRole)})</span>{' '}
                              <span className="font-mono text-xs">{act.action}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {label(act.entityType)} • {formatRelativeTime(act.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="mt-4 border-t pt-3">
                    <Link
                      href="#/admin/audit"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      View full audit trail
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <p className="text-xs text-muted-foreground">
            All figures are fetched live from the HireSphere API — nothing on this page is cached or simulated.
          </p>
        </>
      )}
    </div>
  )
}
