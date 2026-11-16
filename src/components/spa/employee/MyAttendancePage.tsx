'use client'

// ============================================================
// My Attendance — month-scoped attendance for the logged-in
// employee (server forces employeeId; client cannot spoof).
// Data: GET /api/attendance?month=YYYY-MM,
//       GET /api/attendance/summary?month=YYYY-MM.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck2, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react'
import { get, type Paginated } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/components/spa/shared/formatters'

type AttendanceRow = {
  id: string
  date: string
  status: string
  checkIn: string | null
  checkOut: string | null
  workHours: number | null
  note: string | null
}

type Summary = {
  month: string
  items: {
    present: number
    absent: number
    late: number
    halfDay: number
    leave: number
    wfh: number
    holiday: number
    total: number
  }[]
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Dot color per attendance status — mirrors the StatusBadge palette. */
function dotColor(status: string): string {
  switch (status) {
    case 'PRESENT':
    case 'COMPLETED':
      return 'bg-[var(--success)]'
    case 'LATE':
    case 'HALF_DAY':
      return 'bg-[var(--warning)]'
    case 'ABSENT':
      return 'bg-[var(--destructive)]'
    case 'LEAVE':
    case 'WFH':
      return 'bg-[var(--info)]'
    case 'HOLIDAY':
      return 'bg-muted-foreground/50'
    default:
      return 'bg-muted-foreground/40'
  }
}

function monthParam(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function timeOf(iso: string | null): string {
  if (!iso) return '—'
  // Attendance times arrive as UTC-midnight dates + HH:mm — show the HH:mm part
  const m = iso.match(/T(\d{2}:\d{2})/)
  if (m) return m[1]
  return formatDateTime(iso).split(', ')[1] ?? '—'
}

export function MyAttendancePage() {
  const reduce = useReducedMotion()
  const now = new Date()
  const [year, setYear] = useState(now.getUTCFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getUTCMonth()) // 0-based

  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [summary, setSummary] = useState<Summary['items'][number] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const month = useMemo(() => `${year}-${String(monthIndex + 1).padStart(2, '0')}`, [year, monthIndex])

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, monthIndex + delta, 1))
    setYear(d.getUTCFullYear())
    setMonthIndex(d.getUTCMonth())
  }

  const goToToday = () => {
    setYear(now.getUTCFullYear())
    setMonthIndex(now.getUTCMonth())
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, sum] = await Promise.all([
        get<Paginated<AttendanceRow>>(`/api/attendance?month=${month}&pageSize=31&sortBy=date&sortDir=desc`),
        get<Summary>(`/api/attendance/summary?month=${month}`),
      ])
      setRows(list.items)
      setSummary(sum.items[0] ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  /** Map of UTC day-of-month → attendance row. */
  const byDay = useMemo(() => {
    const map = new Map<number, AttendanceRow>()
    for (const r of rows) {
      const day = Number(r.date.slice(0, 10).split('-')[2])
      if (!Number.isNaN(day)) map.set(day, r)
    }
    return map
  }, [rows])

  /** Calendar cells (Mon-first) with leading blanks. */
  const cells = useMemo(() => {
    const firstDow = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() // 0=Sun
    const lead = (firstDow + 6) % 7 // convert to Mon-first
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
    const list: (number | null)[] = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= daysInMonth; d++) list.push(d)
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [year, monthIndex])

  const todayUtc = new Date()
  const isCurrentMonth = todayUtc.getUTCFullYear() === year && todayUtc.getUTCMonth() === monthIndex
  const todayDay = todayUtc.getUTCDate()

  const summaryChips = summary
    ? [
        { key: 'present', label: 'Present', value: summary.present, cls: 'text-[var(--success)]' },
        { key: 'late', label: 'Late', value: summary.late, cls: 'text-[var(--warning)]' },
        { key: 'halfDay', label: 'Half-day', value: summary.halfDay, cls: 'text-[var(--warning)]' },
        { key: 'leave', label: 'Leave', value: summary.leave, cls: 'text-[var(--info)]' },
        { key: 'wfh', label: 'WFH', value: summary.wfh, cls: 'text-[var(--info)]' },
        { key: 'absent', label: 'Absent', value: summary.absent, cls: 'text-[var(--destructive)]' },
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance"
        description="Your daily attendance as recorded by HR. Corrections are made by HR only."
        actions={
          <div className="flex items-center gap-1.5" role="group" aria-label="Month navigation">
            <Button
              variant="outline"
              size="icon"
              className="size-11 sm:size-9"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <span className="min-w-36 text-center text-sm font-medium" aria-live="polite">
              {MONTH_LABELS[monthIndex]} {year}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-11 sm:size-9"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            {!isCurrentMonth ? (
              <Button variant="ghost" size="sm" className="min-h-9" onClick={goToToday}>
                This month
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Summary chips */}
      {loading ? (
        <div className="flex flex-wrap gap-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      ) : summaryChips.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Monthly attendance summary">
          {summaryChips.map((c) => (
            <div key={c.key} className="rounded-full border bg-card px-3.5 py-1.5 text-sm">
              <span className="font-semibold tabular-nums">{c.value}</span>{' '}
              <span className={cn('text-xs', c.cls)}>{c.label}</span>
            </div>
          ))}
          <div className="rounded-full border bg-card px-3.5 py-1.5 text-sm">
            <span className="font-semibold tabular-nums">{summary?.total ?? 0}</span>{' '}
            <span className="text-xs text-muted-foreground">recorded days</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" role="status" aria-live="polite">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
          <span className="sr-only">Loading attendance</span>
        </div>
      ) : (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Calendar grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {MONTH_LABELS[monthIndex]} {year}
              </CardTitle>
              <CardDescription>Each dot marks a recorded attendance day.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={`Attendance calendar for ${MONTH_LABELS[monthIndex]} ${year}`}>
                {WEEKDAY_HEADERS.map((d, i) => (
                  <div
                    key={d}
                    role="columnheader"
                    className={cn(
                      'pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
                      i >= 5 && 'opacity-60',
                    )}
                  >
                    {d}
                  </div>
                ))}
                {cells.map((day, idx) => {
                  if (day === null) return <div key={`blank-${idx}`} role="gridcell" aria-hidden="true" />
                  const dow = idx % 7
                  const weekend = dow >= 5
                  const row = byDay.get(day)
                  const isToday = isCurrentMonth && day === todayDay
                  return (
                    <div
                      key={day}
                      role="gridcell"
                      aria-label={`${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}${row ? `: ${row.status}` : ': no record'}`}
                      className={cn(
                        'relative flex aspect-square min-h-9 flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors sm:min-h-11',
                        weekend ? 'bg-muted/40 text-muted-foreground/60' : 'bg-card',
                        row ? 'border-border' : 'border-dashed border-border/50 text-muted-foreground/60',
                        isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                      )}
                    >
                      <span className="tabular-nums">{day}</span>
                      <span
                        className={cn('size-2 rounded-full', row ? dotColor(row.status) : 'bg-transparent')}
                        aria-hidden="true"
                      />
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {[
                  ['PRESENT', 'Present'],
                  ['LATE', 'Late'],
                  ['HALF_DAY', 'Half-day'],
                  ['ABSENT', 'Absent'],
                  ['LEAVE', 'Leave'],
                  ['WFH', 'WFH'],
                ].map(([s, lbl]) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <span className={cn('size-2 rounded-full', dotColor(s))} aria-hidden="true" />
                    {lbl}
                  </span>
                ))}
              </p>
            </CardContent>
          </Card>

          {/* Records table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarCheck2 className="size-4 text-primary" aria-hidden="true" />
                Daily records
              </CardTitle>
              <CardDescription>
                {rows.length} record{rows.length === 1 ? '' : 's'} in {MONTH_LABELS[monthIndex]} {year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck2}
                  title={`No attendance records for ${MONTH_LABELS[monthIndex]} ${year}`}
                  description="HR records attendance daily — check back after your next working day."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="hidden md:table-cell">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap font-medium">
                            {formatDateTime(r.date).split(',')[0]}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{timeOf(r.checkIn)}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{timeOf(r.checkOut)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.workHours != null ? `${r.workHours.toFixed(2)}h` : '—'}
                          </TableCell>
                          <TableCell className="hidden max-w-52 truncate text-muted-foreground md:table-cell">
                            {r.note ? (
                              <span className="inline-flex items-center gap-1">
                                <Info className="size-3 shrink-0" aria-hidden="true" />
                                {r.note}
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                Hours are computed by HR from check-in/check-out times.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
