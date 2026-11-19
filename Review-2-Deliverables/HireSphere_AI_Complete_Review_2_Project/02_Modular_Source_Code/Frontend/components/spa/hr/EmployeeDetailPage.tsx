'use client'

// ============================================================
// HR — Employee profile (360° view).
// Data: GET /api/employees/:id (+ leaveBalances, user)
// Tabs: Attendance (/api/attendance?employeeId= + /summary),
//       Leave (/api/leaves/requests?employeeId= + /balances),
//       Performance (/api/performance?employeeId=)
// Edit: PATCH /api/employees/:id  (incl. address, emergency)
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Building2, CalendarDays, Mail, MapPin, Pencil, Phone, Star } from 'lucide-react'
import { toast } from 'sonner'

import { get, patch, post } from '@/lib/api-client'
import { EMPLOYEE_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonRows } from '@/components/spa/shared/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatDateTime, label } from '@/components/spa/shared/formatters'
import { cn } from '@/lib/utils'

type EmployeeDetail = {
  id: string
  employeeCode: string
  name: string
  workEmail: string
  phone: string | null
  designation: string
  joiningDate: string
  status: string
  address: string | null
  emergencyContact: string | null
  department: { id: string; name: string } | null
  user: { id: string; email: string; name: string } | null
  leaveBalances: { id: string; year: number; quota: number; used: number; leaveType: { id: string; name: string } }[]
}

type AttendanceRow = {
  id: string
  date: string
  status: string
  checkIn: string | null
  checkOut: string | null
  workHours: number | null
  note: string | null
}

type LeaveRow = {
  id: string
  leaveType: { id: string; name: string }
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  createdAt: string
  reviewNote: string | null
}

type ReviewRow = {
  id: string
  period: string
  reviewDate: string
  rating: number
  goals: string
  achievements: string
  feedback: string
  strengths: string | null
  areasToImprove: string | null
  reviewerName: string
}

const SUMMARY_KEYS = [
  { key: 'present', label: 'Present' },
  { key: 'late', label: 'Late' },
  { key: 'halfDay', label: 'Half Day' },
  { key: 'leave', label: 'Leave' },
  { key: 'wfh', label: 'WFH' },
  { key: 'absent', label: 'Absent' },
  { key: 'holiday', label: 'Holiday' },
  { key: 'total', label: 'Marked' },
] as const

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('size-3.5', i < rating ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-muted-foreground/40')}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export function EmployeeDetailPage({ params }: { params: Record<string, string> }) {
  const [emp, setEmp] = React.useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState('attendance')
  const reduce = useReducedMotion()

  const [month, setMonth] = React.useState(() => new Date().toISOString().slice(0, 7))
  const [attendance, setAttendance] = React.useState<AttendanceRow[]>([])
  const [monthSummary, setMonthSummary] = React.useState<Record<string, number> | null>(null)
  const [attLoading, setAttLoading] = React.useState(false)
  const [leaves, setLeaves] = React.useState<LeaveRow[]>([])
  const [leaveLoading, setLeaveLoading] = React.useState(false)
  const [reviews, setReviews] = React.useState<ReviewRow[]>([])
  const [revLoading, setRevLoading] = React.useState(false)

  const [editOpen, setEditOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [departments, setDepartments] = React.useState<{ id: string; name: string }[]>([])
  const [form, setForm] = React.useState({
    name: '',
    phone: '',
    designation: '',
    departmentId: 'NONE',
    status: 'ACTIVE',
    joiningDate: '',
    address: '',
    emergencyContact: '',
  })

  // new review dialog
  const [revOpen, setRevOpen] = React.useState(false)
  const [revSaving, setRevSaving] = React.useState(false)
  const [revForm, setRevForm] = React.useState({
    period: `${new Date().getFullYear()}-H2`,
    reviewDate: new Date().toISOString().slice(0, 10),
    rating: '3',
    goals: '',
    achievements: '',
    feedback: '',
    strengths: '',
    areasToImprove: '',
  })

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<EmployeeDetail>(`/api/employees/${params.id}`)
      setEmp(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the employee')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  React.useEffect(() => {
    void load()
  }, [load])

  // attendance tab data
  React.useEffect(() => {
    if (!emp || tab !== 'attendance') return
    let cancelled = false
    const run = async () => {
      setAttLoading(true)
      try {
        const [rows, summary] = await Promise.all([
          get<{ items: AttendanceRow[] }>(`/api/attendance?employeeId=${emp.id}&month=${month}&pageSize=50`),
          get<{ month: string; items: { employeeId: string; present: number; absent: number; late: number; halfDay: number; leave: number; wfh: number; holiday: number; total: number }[] }>(
            `/api/attendance/summary?month=${month}`,
          ),
        ])
        if (cancelled) return
        setAttendance(rows.items)
        const mine = summary.items.find((s) => s.employeeId === emp.id)
        const fallback = { present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, wfh: 0, holiday: 0, total: 0 }
        setMonthSummary(mine ?? fallback)
      } catch {
        if (!cancelled) setAttendance([])
      } finally {
        if (!cancelled) setAttLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [emp, tab, month])

  // leave tab data
  React.useEffect(() => {
    if (!emp || tab !== 'leave') return
    let cancelled = false
    const run = async () => {
      setLeaveLoading(true)
      try {
        const rows = await get<{ items: LeaveRow[] }>(`/api/leaves/requests?employeeId=${emp.id}&pageSize=50`)
        if (!cancelled) setLeaves(rows.items)
      } catch {
        if (!cancelled) setLeaves([])
      } finally {
        if (!cancelled) setLeaveLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [emp, tab])

  // performance tab data
  React.useEffect(() => {
    if (!emp || tab !== 'performance') return
    let cancelled = false
    const run = async () => {
      setRevLoading(true)
      try {
        const rows = await get<{ items: ReviewRow[] }>(`/api/performance?employeeId=${emp.id}&pageSize=50`)
        if (!cancelled) setReviews(rows.items)
      } catch {
        if (!cancelled) setReviews([])
      } finally {
        if (!cancelled) setRevLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [emp, tab])

  const openEdit = async () => {
    if (!emp) return
    setForm({
      name: emp.name,
      phone: emp.phone ?? '',
      designation: emp.designation,
      departmentId: emp.department?.id ?? 'NONE',
      status: emp.status,
      joiningDate: emp.joiningDate?.slice(0, 10) ?? '',
      address: emp.address ?? '',
      emergencyContact: emp.emergencyContact ?? '',
    })
    if (departments.length === 0) {
      try {
        const data = await get<{ items: { id: string; name: string }[] }>('/api/departments')
        setDepartments(data.items)
      } catch {
        // optional
      }
    }
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!emp) return
    setSaving(true)
    try {
      await patch(`/api/employees/${emp.id}`, {
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || null,
        designation: form.designation.trim() || undefined,
        departmentId: form.departmentId !== 'NONE' ? form.departmentId : null,
        status: form.status,
        joiningDate: form.joiningDate || undefined,
        address: form.address.trim() || null,
        emergencyContact: form.emergencyContact.trim() || null,
      })
      toast.success('Employee profile updated.')
      setEditOpen(false)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the employee')
    } finally {
      setSaving(false)
    }
  }

  const submitReview = async () => {
    if (!emp) return
    if (!revForm.goals.trim() || !revForm.achievements.trim() || !revForm.feedback.trim()) {
      toast.error('Goals, achievements and feedback are required.')
      return
    }
    setRevSaving(true)
    try {
      await post('/api/performance', {
        employeeId: emp.id,
        period: revForm.period.trim(),
        reviewDate: revForm.reviewDate,
        rating: Number(revForm.rating),
        goals: revForm.goals.trim(),
        achievements: revForm.achievements.trim(),
        feedback: revForm.feedback.trim(),
        strengths: revForm.strengths.trim() || undefined,
        areasToImprove: revForm.areasToImprove.trim() || undefined,
      })
      toast.success('Performance review recorded.')
      setRevOpen(false)
      setTab('performance')
      // trigger refetch by re-running effect: simplest is to reset tab state
      setReviews((prev) => prev) // data refetches on next tab visit
      setRevLoading(true)
      const rows = await get<{ items: ReviewRow[] }>(`/api/performance?employeeId=${emp.id}&pageSize=50`)
      setReviews(rows.items)
      setRevLoading(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the review')
      setRevLoading(false)
    } finally {
      setRevSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <SkeletonRows rows={3} />
        <div className="h-72 animate-pulse rounded-xl border bg-card" />
        <span className="sr-only">Loading employee</span>
      </div>
    )
  }

  if (error || !emp) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee" />
        <ErrorState title="Could not load this employee" message={error ?? 'Not found'} onRetry={() => void load()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={emp.name}
        description={`${emp.designation} • ${emp.department?.name ?? 'No department'} • Joined ${formatDate(emp.joiningDate)}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            <Button size="sm" className="min-h-9 gap-1.5" onClick={() => void openEdit()}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit profile
            </Button>
          </>
        }
      />

      {/* ---- profile card ---- */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4">
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-lg font-semibold text-primary"
                aria-hidden="true"
              >
                {emp.name.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
              </span>
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  {emp.name}
                  <StatusBadge status={emp.status} />
                </p>
                <p className="text-xs text-muted-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5">{emp.employeeCode}</code>
                  {emp.user ? ' • portal access enabled' : ' • no login linked'}
                </p>
              </div>
            </div>
            <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2 sm:pl-6 lg:grid-cols-4">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="size-3" aria-hidden="true" /> Work email
                </dt>
                <dd className="truncate">{emp.workEmail}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="size-3" aria-hidden="true" /> Phone
                </dt>
                <dd>{emp.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3" aria-hidden="true" /> Department
                </dt>
                <dd>{emp.department?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3" aria-hidden="true" /> Joining date
                </dt>
                <dd>{formatDate(emp.joiningDate)}</dd>
              </div>
              {emp.address ? (
                <div className="sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3" aria-hidden="true" /> Address
                  </dt>
                  <dd className="whitespace-pre-line">{emp.address}</dd>
                </div>
              ) : null}
              {emp.emergencyContact ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Emergency contact</dt>
                  <dd>{emp.emergencyContact}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- tabs ---- */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="attendance" className="min-h-9">
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="min-h-9">
            Leave
          </TabsTrigger>
          <TabsTrigger value="performance" className="min-h-9">
            Performance
          </TabsTrigger>
        </TabsList>

        {/* ===== attendance tab ===== */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Monthly summary</h2>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-44"
              aria-label="Attendance month"
            />
          </div>
          {monthSummary ? (
            <div className="flex flex-wrap gap-2">
              {SUMMARY_KEYS.map((s) => (
                <Badge
                  key={s.key}
                  variant="outline"
                  className="gap-1.5 px-3 py-1.5 text-sm font-normal"
                  title={`${monthSummary[s.key]} ${s.label.toLowerCase()} days in ${month}`}
                >
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold tabular-nums">{monthSummary[s.key]}</span>
                </Badge>
              ))}
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily records — {month}</CardTitle>
              <CardDescription>Corrections are made from the Attendance page.</CardDescription>
            </CardHeader>
            <CardContent>
              {attLoading ? (
                <SkeletonRows rows={5} />
              ) : attendance.length === 0 ? (
                <EmptyState title="No attendance in this month" description="Try another month, or mark attendance from the Attendance page." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check in</TableHead>
                        <TableHead>Check out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead className="hidden md:table-cell">Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {r.checkIn ? formatDateTime(r.checkIn).split(', ')[1] : '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {r.checkOut ? formatDateTime(r.checkOut).split(', ')[1] : '—'}
                          </TableCell>
                          <TableCell className="tabular-nums">{r.workHours ?? '—'}</TableCell>
                          <TableCell className="hidden max-w-48 truncate md:table-cell">{r.note ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== leave tab ===== */}
        <TabsContent value="leave" className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Leave requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveLoading ? (
                <SkeletonRows rows={4} />
              ) : leaves.length === 0 ? (
                <EmptyState title="No leave requests" description="Requests submitted by this employee appear here." />
              ) : (
                <ul className="space-y-2">
                  {leaves.map((l) => (
                    <li key={l.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {l.leaveType.name} • {l.days} day{l.days === 1 ? '' : 's'}
                        </p>
                        <StatusBadge status={l.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(l.startDate)} → {formatDate(l.endDate)} • applied {formatDate(l.createdAt)}
                      </p>
                      <p className="mt-1 text-sm">{l.reason}</p>
                      {l.reviewNote ? (
                        <p className="mt-1 rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                          Reviewer note: {l.reviewNote}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balances {emp.leaveBalances[0] ? `(${emp.leaveBalances[0].year})` : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              {emp.leaveBalances.length === 0 ? (
                <EmptyState title="No leave balances" description="Balances are created per year from leave types." />
              ) : (
                <ul className="space-y-3">
                  {emp.leaveBalances.map((b) => {
                    const remaining = Math.max(0, b.quota - b.used)
                    return (
                      <li key={b.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{b.leaveType.name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {b.used}/{b.quota} used • {remaining} left
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500"
                            style={{ width: `${Math.min(100, (b.used / Math.max(1, b.quota)) * 100)}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== performance tab ===== */}
        <TabsContent value="performance" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="min-h-9 gap-1.5" onClick={() => setRevOpen(true)}>
              <Star className="size-4" aria-hidden="true" />
              New Review
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {revLoading ? (
                <SkeletonRows rows={4} />
              ) : reviews.length === 0 ? (
                <EmptyState
                  title="No performance reviews yet"
                  description="Create the first periodic review with goals, achievements and feedback."
                />
              ) : (
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {r.period} • {formatDate(r.reviewDate)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Stars rating={r.rating} />
                          <span className="text-xs text-muted-foreground">by {r.reviewerName}</span>
                        </div>
                      </div>
                      <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-muted-foreground">Goals</dt>
                          <dd>{r.goals}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Achievements</dt>
                          <dd>{r.achievements}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-muted-foreground">Feedback</dt>
                          <dd>{r.feedback}</dd>
                        </div>
                        {r.strengths ? (
                          <div>
                            <dt className="text-xs text-muted-foreground">Strengths</dt>
                            <dd>{r.strengths}</dd>
                          </div>
                        ) : null}
                        {r.areasToImprove ? (
                          <div>
                            <dt className="text-xs text-muted-foreground">Areas to improve</dt>
                            <dd>{r.areasToImprove}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- edit dialog ---- */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
            <DialogDescription>
              {emp.employeeCode} — updates are audited (EMPLOYEE_UPDATED).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ed-name">Full name</Label>
                <Input id="ed-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ed-phone">Phone</Label>
                <Input id="ed-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ed-desig">Designation</Label>
                <Input id="ed-desig" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ed-status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="ed-status" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {label(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ed-dept">Department</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger id="ed-dept" aria-label="Department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ed-date">Joining date</Label>
                <Input
                  id="ed-date"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ed-addr">Address</Label>
              <Textarea id="ed-addr" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ed-emg">Emergency contact</Label>
              <Input
                id="ed-emg"
                placeholder="Name — relationship — phone"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={saving} className="min-h-9">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- new review dialog ---- */}
      <Dialog open={revOpen} onOpenChange={setRevOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New performance review — {emp.name}</DialogTitle>
            <DialogDescription>Periodic review with rating criteria. Saved against your reviewer identity.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="rv-period">Period</Label>
                <Input id="rv-period" value={revForm.period} onChange={(e) => setRevForm({ ...revForm, period: e.target.value })} placeholder="e.g. 2026-H2" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rv-date">Review date</Label>
                <Input id="rv-date" type="date" value={revForm.reviewDate} onChange={(e) => setRevForm({ ...revForm, reviewDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rv-rating">Rating</Label>
                <Select value={revForm.rating} onValueChange={(v) => setRevForm({ ...revForm, rating: v })}>
                  <SelectTrigger id="rv-rating" aria-label="Rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Needs improvement</SelectItem>
                    <SelectItem value="2">2 — Below expectations</SelectItem>
                    <SelectItem value="3">3 — Meets expectations</SelectItem>
                    <SelectItem value="4">4 — Exceeds expectations</SelectItem>
                    <SelectItem value="5">5 — Outstanding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rv-goals">Goals *</Label>
              <Textarea id="rv-goals" rows={2} value={revForm.goals} onChange={(e) => setRevForm({ ...revForm, goals: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rv-ach">Achievements *</Label>
              <Textarea id="rv-ach" rows={2} value={revForm.achievements} onChange={(e) => setRevForm({ ...revForm, achievements: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rv-fb">Feedback *</Label>
              <Textarea id="rv-fb" rows={2} value={revForm.feedback} onChange={(e) => setRevForm({ ...revForm, feedback: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="rv-str">Strengths</Label>
                <Textarea id="rv-str" rows={2} value={revForm.strengths} onChange={(e) => setRevForm({ ...revForm, strengths: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rv-imp">Areas to improve</Label>
                <Textarea id="rv-imp" rows={2} value={revForm.areasToImprove} onChange={(e) => setRevForm({ ...revForm, areasToImprove: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitReview()} disabled={revSaving} className="min-h-9">
              {revSaving ? 'Saving…' : 'Save review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
