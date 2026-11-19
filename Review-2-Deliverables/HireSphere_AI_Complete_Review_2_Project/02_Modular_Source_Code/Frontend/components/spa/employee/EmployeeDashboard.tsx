'use client'

// ============================================================
// Employee Dashboard — welcome card, today's attendance chip,
// monthly presence, pending leaves, leave balances and latest
// review. Data: GET /api/dashboard/employee.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Clock,
  IdCard,
  Sparkles,
  Star,
  Target,
} from 'lucide-react'
import { get } from '@/lib/api-client'
import { useRouter } from '@/lib/router'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatCard } from '@/components/spa/shared/StatCard'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonCards, SkeletonRows } from '@/components/spa/shared/Loading'
import { Progress } from '@/components/ui/progress'
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '@/components/spa/shared/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type EmployeeDashboardData = {
  profile: {
    id: string
    employeeCode: string
    name: string
    workEmail: string
    designation: string
    status: string
    joiningDate: string
    department: { id: string; name: string } | null
  }
  todayAttendance: { id: string; status: string; checkIn: string | null; checkOut: string | null } | null
  monthlyPresent: number
  pendingLeaves: number
  latestReview: { id: string; period: string; rating: number; reviewDate: string; feedback: string | null } | null
  leaveBalances: { id: string; quota: number; used: number; remaining: number; leaveType: { id: string; name: string } }[]
  today: string
}

export function EmployeeDashboard() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const meName = useAuthStore((s) => s.user?.name)

  const [data, setData] = useState<EmployeeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await get<EmployeeDashboardData>('/api/dashboard/employee')
      setData(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const firstName = (data?.profile.name ?? meName ?? '').split(/\s+/)[0] || 'there'

  return (
    <div className="space-y-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-6 text-primary" aria-hidden="true" />
              Hi {firstName}, welcome to your workspace
            </span>
          }
          description="Your attendance, leave balances and performance — all in one place."
          actions={
            <>
              <Button onClick={() => router.navigate('#/employee/leaves')} className="min-h-11 gap-2" aria-label="Apply for leave">
                <CalendarPlus className="size-4" aria-hidden="true" />
                Apply Leave
              </Button>
              <Button variant="outline" onClick={() => router.navigate('#/employee/attendance')} className="min-h-11 gap-2" aria-label="View attendance">
                <CalendarCheck2 className="size-4" aria-hidden="true" />
                View Attendance
              </Button>
            </>
          }
        />
      </motion.div>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading || !data ? (
        <div className="space-y-6" role="status" aria-live="polite">
          <div className="rounded-xl border bg-card p-6">
            <SkeletonRows rows={2} />
          </div>
          <SkeletonCards count={4} />
          <span className="sr-only">Loading dashboard</span>
        </div>
      ) : (
        <>
          {/* Welcome / employment card */}
          <Card className="border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                  <IdCard className="size-6 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {data.profile.name}
                    <StatusBadge status={data.profile.status} />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.profile.designation} · {data.profile.department?.name ?? 'No department'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.profile.employeeCode} · joined {formatDate(data.profile.joiningDate)}
                  </p>
                </div>
              </div>
              {/* Today attendance chip */}
              <div className="shrink-0 rounded-xl border bg-card p-3.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today</p>
                {data.todayAttendance ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={data.todayAttendance.status} />
                    <span className="text-xs text-muted-foreground">
                      {data.todayAttendance.checkIn ? `In ${formatDateTime(data.todayAttendance.checkIn).split(', ')[1]}` : 'No check-in'}
                      {data.todayAttendance.checkOut
                        ? ` · Out ${formatDateTime(data.todayAttendance.checkOut).split(', ')[1]}`
                        : ''}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" aria-hidden="true" />
                    Not marked yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={CalendarCheck2}
              label="Present this month"
              value={data.monthlyPresent}
              hint="Present days this month"
              index={0}
            />
            <StatCard
              icon={CalendarDays}
              label="Pending leaves"
              value={data.pendingLeaves}
              hint="Leave requests awaiting decision"
              index={1}
            />
            <StatCard
              icon={Target}
              label="Latest review"
              value={
                data.latestReview ? (
                  <span className="inline-flex items-center gap-1.5">
                    {data.latestReview.rating}
                    <span className="flex" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'size-4',
                            i < data.latestReview!.rating ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-muted-foreground/40',
                          )}
                        />
                      ))}
                    </span>
                  </span>
                ) : (
                  '—'
                )
              }
              hint={data.latestReview ? `${data.latestReview.period} · ${formatDate(data.latestReview.reviewDate)}` : 'No review yet'}
              index={2}
            />
            <StatCard
              icon={BadgeCheck}
              label="Leave balance"
              value={data.leaveBalances.reduce((sum, b) => sum + b.remaining, 0)}
              hint={`${data.leaveBalances.length} leave type${data.leaveBalances.length === 1 ? '' : 's'} tracked`}
              index={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Leave balances */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Leave balances</CardTitle>
                  <CardDescription>Used vs quota per leave type.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="min-h-9 gap-1" onClick={() => router.navigate('#/employee/leaves')}>
                  Manage
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.leaveBalances.length === 0 ? (
                  <EmptyState
                    title="No leave balances yet"
                    description="Balances appear once HR sets up your leave types."
                    className="py-6"
                  />
                ) : (
                  data.leaveBalances.map((b) => {
                    const usedPct = b.quota > 0 ? Math.min(100, Math.round((b.used / b.quota) * 100)) : 0
                    return (
                      <div key={b.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium">{b.leaveType.name}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {b.used} used · <span className="font-medium text-foreground">{b.remaining} left</span> of {b.quota}
                          </span>
                        </div>
                        <Progress value={usedPct} aria-label={`${b.leaveType.name}: ${b.used} of ${b.quota} used`} />
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Latest performance review */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Latest performance review</CardTitle>
                  <CardDescription>
                    {data.latestReview ? `${data.latestReview.period} · reviewed ${formatDate(data.latestReview.reviewDate)}` : 'No reviews yet'}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="min-h-9 gap-1" onClick={() => router.navigate('#/employee/performance')}>
                  Open
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent>
                {data.latestReview ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5" role="img" aria-label={`Rating ${data.latestReview.rating} out of 5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'size-5',
                            i < data.latestReview!.rating ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-muted-foreground/40',
                          )}
                          aria-hidden="true"
                        />
                      ))}
                      <span className="ml-1 text-sm font-semibold tabular-nums">{data.latestReview.rating}/5</span>
                    </div>
                    {data.latestReview.feedback ? (
                      <p className="line-clamp-4 rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
                        “{data.latestReview.feedback}”
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No written feedback in this review.</p>
                    )}
                  </div>
                ) : (
                  <EmptyState
                    icon={Target}
                    title="No reviews yet"
                    description="Your first performance review will appear here after HR publishes it."
                    className="py-6"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" aria-hidden="true" />
            Synced {formatRelativeTime(new Date())} · contact HR for corrections to attendance or personal records.
          </p>
        </>
      )}
    </div>
  )
}
