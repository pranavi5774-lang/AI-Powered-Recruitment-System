'use client'

// ============================================================
// HR — Attendance management.
// Data: GET /api/attendance?month=YYYY-MM&employeeId=…
//       GET /api/attendance/summary?month=…
// Mark: POST /api/attendance (409 DUPLICATE_ATTENDANCE → toast
//       guides HR to the Correct action). Correct: PATCH /api/attendance/[id].
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarCheck2, PencilLine, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { get, post, patch } from '@/lib/api-client'
import { ATTENDANCE_STATUSES } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/spa/shared/DataTable'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, label } from '@/components/spa/shared/formatters'
import type { ApiError } from '@/lib/api-client'

type AttendanceRow = {
  id: string
  employeeId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  workHours: number | null
  note: string | null
  employee: { id: string; name: string; employeeCode: string }
}

type EmployeeOption = { id: string; name: string; employeeCode: string }

type SummaryItem = {
  employeeId: string
  name: string
  employeeCode: string
  present: number
  absent: number
  late: number
  halfDay: number
  leave: number
  wfh: number
  holiday: number
  total: number
}

const MARK_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'WFH', 'HOLIDAY']

function timeOf(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toISOString().slice(11, 16)
  } catch {
    return '—'
  }
}

export function AttendancePage(_props: unknown) {
  const today = new Date().toISOString().slice(0, 10)
  const [month, setMonth] = React.useState(() => new Date().toISOString().slice(0, 7))
  const [employeeId, setEmployeeId] = React.useState('ALL')

  const [items, setItems] = React.useState<AttendanceRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 14
  const [employees, setEmployees] = React.useState<EmployeeOption[]>([])
  const [summary, setSummary] = React.useState<SummaryItem[]>([])
  const [summaryLoading, setSummaryLoading] = React.useState(true)
  const reduce = useReducedMotion()

  // mark dialog
  const [markOpen, setMarkOpen] = React.useState(false)
  const [markForm, setMarkForm] = React.useState({
    employeeId: '',
    date: today,
    status: 'PRESENT',
    checkIn: '09:00',
    checkOut: '18:00',
    note: '',
  })
  const [marking, setMarking] = React.useState(false)

  // correct dialog
  const [correctTarget, setCorrectTarget] = React.useState<AttendanceRow | null>(null)
  const [correctForm, setCorrectForm] = React.useState({ status: 'PRESENT', checkIn: '', checkOut: '', note: '' })
  const [correcting, setCorrecting] = React.useState(false)

  React.useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await get<{ items: EmployeeOption[] }>('/api/employees?pageSize=100')
        setEmployees(data.items)
      } catch {
        // filter optional
      }
    }
    void loadEmployees()
  }, [])

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ month, page: String(page), pageSize: String(pageSize) })
      if (employeeId !== 'ALL') params.set('employeeId', employeeId)
      const data = await get<{ items: AttendanceRow[]; total: number; totalPages: number }>(
        `/api/attendance?${params.toString()}`,
      )
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [month, page, employeeId])

  const loadSummary = React.useCallback(async () => {
    setSummaryLoading(true)
    try {
      const data = await get<{ items: SummaryItem[] }>(`/api/attendance/summary?month=${month}`)
      setSummary(data.items)
    } catch {
      setSummary([])
    } finally {
      setSummaryLoading(false)
    }
  }, [month])

  React.useEffect(() => {
    void load()
  }, [load])
  React.useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  const aggregate = React.useMemo(() => {
    const acc: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, LEAVE: 0, WFH: 0, HOLIDAY: 0 }
    for (const s of summary) {
      acc.PRESENT += s.present
      acc.ABSENT += s.absent
      acc.LATE += s.late
      acc.HALF_DAY += s.halfDay
      acc.LEAVE += s.leave
      acc.WFH += s.wfh
      acc.HOLIDAY += s.holiday
    }
    return acc
  }, [summary])

  const openMark = () => {
    setMarkForm({
      employeeId: employees[0]?.id ?? '',
      date: today,
      status: 'PRESENT',
      checkIn: '09:00',
      checkOut: '18:00',
      note: '',
    })
    setMarkOpen(true)
  }

  const submitMark = async () => {
    if (!markForm.employeeId) {
      toast.error('Select an employee.')
      return
    }
    setMarking(true)
    try {
      await post('/api/attendance', {
        employeeId: markForm.employeeId,
        date: markForm.date,
        status: markForm.status,
        checkIn: markForm.status === 'ABSENT' || markForm.status === 'LEAVE' || markForm.status === 'HOLIDAY' ? undefined : markForm.checkIn || undefined,
        checkOut: markForm.status === 'ABSENT' || markForm.status === 'LEAVE' || markForm.status === 'HOLIDAY' ? undefined : markForm.checkOut || undefined,
        note: markForm.note.trim() || undefined,
      })
      toast.success('Attendance marked.')
      setMarkOpen(false)
      void load()
      void loadSummary()
    } catch (e) {
      const code = (e as ApiError).code
      if (code === 'DUPLICATE_ATTENDANCE') {
        toast.error('Attendance is already marked for that day — use “Correct” on the row to change it.')
      } else {
        toast.error(e instanceof Error ? e.message : 'Could not mark attendance')
      }
    } finally {
      setMarking(false)
    }
  }

  const openCorrect = (row: AttendanceRow) => {
    setCorrectTarget(row)
    setCorrectForm({
      status: row.status,
      checkIn: timeOf(row.checkIn) === '—' ? '' : timeOf(row.checkIn),
      checkOut: timeOf(row.checkOut) === '—' ? '' : timeOf(row.checkOut),
      note: row.note ?? '',
    })
  }

  const submitCorrect = async () => {
    if (!correctTarget) return
    setCorrecting(true)
    try {
      await patch(`/api/attendance/${correctTarget.id}`, {
        status: correctForm.status,
        checkIn: correctForm.checkIn || undefined,
        checkOut: correctForm.checkOut || undefined,
        note: correctForm.note.trim() || undefined,
      })
      toast.success('Attendance corrected and recomputed.')
      setCorrectTarget(null)
      void load()
      void loadSummary()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not correct attendance')
    } finally {
      setCorrecting(false)
    }
  }

  const columns: DataTableColumn<AttendanceRow>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (r) => <span className="whitespace-nowrap">{formatDate(r.date)}</span>,
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.employee.name}</p>
          <p className="text-xs text-muted-foreground">{r.employee.employeeCode}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'checkIn',
      header: 'Check in',
      render: (r) => <span className="tabular-nums text-muted-foreground">{timeOf(r.checkIn)}</span>,
    },
    {
      key: 'checkOut',
      header: 'Check out',
      hideOnMobile: true,
      render: (r) => <span className="tabular-nums text-muted-foreground">{timeOf(r.checkOut)}</span>,
    },
    {
      key: 'workHours',
      header: 'Hours',
      hideOnMobile: true,
      render: (r) => <span className="tabular-nums">{r.workHours ?? '—'}</span>,
    },
    {
      key: 'note',
      header: 'Note',
      hideOnMobile: true,
      render: (r) => <span className="text-muted-foreground">{r.note ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1"
          onClick={() => openCorrect(r)}
          aria-label={`Correct attendance for ${r.employee.name} on ${r.date}`}
        >
          <PencilLine className="size-3.5" aria-hidden="true" />
          Correct
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Daily records and monthly summaries. Duplicates are blocked — corrections recompute hours."
        actions={
          <Button size="sm" className="min-h-9 gap-1.5" onClick={openMark} disabled={employees.length === 0}>
            <Plus className="size-4" aria-hidden="true" />
            Mark Attendance
          </Button>
        }
      />

      {/* filters */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="grid gap-1.5">
              <Label htmlFor="att-month" className="text-xs">
                Month
              </Label>
              <Input
                id="att-month"
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value)
                  setPage(1)
                }}
                className="w-44"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Employee</Label>
              <Select
                value={employeeId}
                onValueChange={(v) => {
                  setEmployeeId(v)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-52" aria-label="Filter by employee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="ALL">All employees</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* legend */}
            <div className="ml-auto flex flex-wrap items-center gap-1.5" aria-label="Status legend">
              {ATTENDANCE_STATUSES.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* summary chips (aggregate across employees, from /summary) */}
      <div className="flex flex-wrap gap-2" aria-label="Month summary">
        {summaryLoading ? (
          <span className="text-sm text-muted-foreground">Computing summary…</span>
        ) : (
          MARK_STATUSES.map((s) => (
            <Badge key={s} variant="outline" className="gap-1.5 px-3 py-1.5 text-sm font-normal">
              <StatusBadge status={s} />
              <span className="font-semibold tabular-nums">{aggregate[s] ?? 0}</span>
            </Badge>
          ))
        )}
      </div>

      {/* per-employee summary strip */}
      {summary.length > 0 && employeeId === 'ALL' ? (
        <div className="overflow-x-auto rounded-xl border bg-card p-4">
          <table className="w-full min-w-[560px] text-sm" aria-label="Per-employee monthly summary">
            <caption className="sr-only">Monthly attendance summary per employee</caption>
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">Employee</th>
                <th scope="col" className="px-2 py-2 font-medium">Present</th>
                <th scope="col" className="px-2 py-2 font-medium">Late</th>
                <th scope="col" className="px-2 py-2 font-medium">Half</th>
                <th scope="col" className="px-2 py-2 font-medium">Leave</th>
                <th scope="col" className="px-2 py-2 font-medium">WFH</th>
                <th scope="col" className="px-2 py-2 font-medium">Absent</th>
                <th scope="col" className="px-2 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.employeeId} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{s.name}</span>{' '}
                    <span className="text-xs text-muted-foreground">{s.employeeCode}</span>
                  </td>
                  <td className="px-2 py-2 tabular-nums">{s.present}</td>
                  <td className="px-2 py-2 tabular-nums">{s.late}</td>
                  <td className="px-2 py-2 tabular-nums">{s.halfDay}</td>
                  <td className="px-2 py-2 tabular-nums">{s.leave}</td>
                  <td className="px-2 py-2 tabular-nums">{s.wfh}</td>
                  <td className="px-2 py-2 tabular-nums">{s.absent}</td>
                  <td className="px-2 py-2 font-medium tabular-nums">{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <DataTable<AttendanceRow>
        columns={columns}
        items={items}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={() => void load()}
        emptyTitle="No attendance records"
        emptyDescription="Nothing marked for this month/employee yet. Use “Mark Attendance” to add the first entry."
        emptyAction={
          <Button variant="outline" size="sm" onClick={openMark} disabled={employees.length === 0}>
            <CalendarCheck2 className="size-4" aria-hidden="true" />
            Mark attendance
          </Button>
        }
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* ---- Mark dialog ---- */}
      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark attendance</DialogTitle>
            <DialogDescription>One record per employee per day — duplicates are rejected by the server.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="mk-emp">Employee</Label>
              <Select value={markForm.employeeId} onValueChange={(v) => setMarkForm({ ...markForm, employeeId: v })}>
                <SelectTrigger id="mk-emp" aria-label="Employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="mk-date">Date</Label>
                <Input id="mk-date" type="date" max={today} value={markForm.date} onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mk-status">Status</Label>
                <Select value={markForm.status} onValueChange={(v) => setMarkForm({ ...markForm, status: v })}>
                  <SelectTrigger id="mk-status" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {label(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!['ABSENT', 'LEAVE', 'HOLIDAY'].includes(markForm.status) ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="mk-in">Check-in</Label>
                  <Input id="mk-in" type="time" value={markForm.checkIn} onChange={(e) => setMarkForm({ ...markForm, checkIn: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mk-out">Check-out</Label>
                  <Input id="mk-out" type="time" value={markForm.checkOut} onChange={(e) => setMarkForm({ ...markForm, checkOut: e.target.value })} />
                </div>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="mk-note">Note</Label>
              <Textarea id="mk-note" rows={2} value={markForm.note} onChange={(e) => setMarkForm({ ...markForm, note: e.target.value })} placeholder="Optional context…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitMark()} disabled={marking} className="min-h-9">
              {marking ? 'Saving…' : 'Mark'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Correct dialog ---- */}
      <Dialog open={correctTarget !== null} onOpenChange={(o) => !o && setCorrectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Correct attendance</DialogTitle>
            <DialogDescription>
              {correctTarget
                ? `${correctTarget.employee.name} • ${formatDate(correctTarget.date)}. Hours are recomputed from the times.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cr-status">Status</Label>
              <Select value={correctForm.status} onValueChange={(v) => setCorrectForm({ ...correctForm, status: v })}>
                <SelectTrigger id="cr-status" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cr-in">Check-in</Label>
                <Input id="cr-in" type="time" value={correctForm.checkIn} onChange={(e) => setCorrectForm({ ...correctForm, checkIn: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cr-out">Check-out</Label>
                <Input id="cr-out" type="time" value={correctForm.checkOut} onChange={(e) => setCorrectForm({ ...correctForm, checkOut: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cr-note">Note</Label>
              <Textarea id="cr-note" rows={2} value={correctForm.note} onChange={(e) => setCorrectForm({ ...correctForm, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectTarget(null)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitCorrect()} disabled={correcting} className="min-h-9">
              {correcting ? 'Saving…' : 'Save correction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
