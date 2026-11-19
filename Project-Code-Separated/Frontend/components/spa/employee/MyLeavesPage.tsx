'use client'

// ============================================================
// My Leaves — balances, apply dialog and request history for the
// logged-in employee.
// Data: GET /api/leaves/balances, GET /api/leaves/types,
//       GET /api/leaves/requests (own), POST /api/leaves/requests,
//       PATCH /api/leaves/requests/:id {status:'CANCELLED'}.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, CalendarPlus, Info, XCircle } from 'lucide-react'
import { get, patch, post, ApiError, type Paginated } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/spa/shared/Spinner'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import { formatDate } from '@/components/spa/shared/formatters'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type LeaveType = { id: string; name: string; annualQuota: number; description: string | null }
type Balance = { id: string; quota: number; used: number; remaining: number; leaveType: { id: string; name: string } }
type LeaveRequest = {
  id: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  reviewNote: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  createdAt: string
  leaveType: { id: string; name: string }
}

/** UTC YYYY-MM-DD for "today" — matches the server's utcDateOnly(). */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Inclusive day count between YYYY-MM-DD strings (UTC-safe). */
function inclusiveDays(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00.000Z`).getTime()
  const e = new Date(`${end}T00:00:00.000Z`).getTime()
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0
  return Math.round((e - s) / 86_400_000) + 1
}

export function MyLeavesPage() {
  const reduce = useReducedMotion()

  const [balances, setBalances] = useState<Balance[]>([])
  const [types, setTypes] = useState<LeaveType[]>([])
  const [requests, setRequests] = useState<Paginated<LeaveRequest> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // apply dialog state
  const [applyOpen, setApplyOpen] = useState(false)
  const [leaveTypeId, setLeaveTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [bal, tps, reqs] = await Promise.all([
        get<{ items: Balance[] }>('/api/leaves/balances'),
        get<{ items: LeaveType[] }>('/api/leaves/types'),
        get<Paginated<LeaveRequest>>(`/api/leaves/requests?page=${page}&pageSize=10&sortBy=createdAt&sortDir=desc`),
      ])
      setBalances(bal.items)
      setTypes(tps.items)
      setRequests(reqs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave data')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  const minDate = todayIso()
  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    return inclusiveDays(startDate, endDate)
  }, [startDate, endDate])

  const selectedBalance = balances.find((b) => b.leaveType.id === leaveTypeId)

  const resetForm = () => {
    setLeaveTypeId('')
    setStartDate('')
    setEndDate('')
    setReason('')
  }

  const handleSubmit = async () => {
    if (!leaveTypeId) {
      toast.error('Choose a leave type.')
      return
    }
    if (!startDate || !endDate) {
      toast.error('Pick both a start and end date.')
      return
    }
    if (endDate < startDate) {
      toast.error('End date must be on or after the start date.')
      return
    }
    if (startDate < minDate) {
      toast.error('Leave dates must be today or in the future.')
      return
    }
    if (reason.trim().length < 3) {
      toast.error('Add a short reason for your manager.')
      return
    }
    setSubmitting(true)
    try {
      await post('/api/leaves/requests', { leaveTypeId, startDate, endDate, reason: reason.trim() })
      toast.success('Leave request submitted', { description: 'HR will review it shortly.' })
      setApplyOpen(false)
      resetForm()
      setPage(1)
      await load()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LEAVE_OVERLAP') {
        toast.error('Dates overlap an existing request', {
          description: 'You already have a pending or approved leave covering these dates.',
        })
      } else if (err instanceof ApiError && err.code === 'INSUFFICIENT_BALANCE') {
        toast.error('Not enough leave balance', { description: err.message })
      } else if (err instanceof ApiError && err.code === 'PAST_DATE') {
        toast.error('Leave dates must be today or in the future.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to submit request')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (req: LeaveRequest) => {
    const okCancel = await confirmDialog({
      title: 'Cancel this leave request?',
      description: `${req.leaveType.name}, ${formatDate(req.startDate)} → ${formatDate(req.endDate)} (${req.days} day${req.days === 1 ? '' : 's'}). This cannot be undone.`,
      confirmText: 'Cancel request',
      destructive: true,
    })
    if (!okCancel) return
    setCancellingId(req.id)
    try {
      await patch(`/api/leaves/requests/${req.id}`, { status: 'CANCELLED' })
      toast.success('Request cancelled.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel request')
    } finally {
      setCancellingId(null)
    }
  }

  const balancesById = useMemo(() => new Map(balances.map((b) => [b.leaveType.id, b])), [balances])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description="Check balances, apply for time off and track approvals."
        actions={
          <Button onClick={() => setApplyOpen(true)} className="min-h-11 gap-2" aria-label="Apply for leave">
            <CalendarPlus className="size-4" aria-hidden="true" />
            Apply Leave
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <div className="space-y-6" role="status" aria-live="polite">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
          <span className="sr-only">Loading leave data</span>
        </div>
      ) : (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Balances strip */}
          {balances.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No leave balances yet"
              description="Balances are assigned by HR per leave type for each year."
              className="py-8"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {balances.map((b) => {
                const usedPct = b.quota > 0 ? Math.min(100, Math.round((b.used / b.quota) * 100)) : 0
                return (
                  <Card key={b.id} className="p-0">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{b.leaveType.name}</p>
                        <p className="text-xs tabular-nums text-muted-foreground">
                          <span className="font-semibold text-foreground">{b.remaining}</span> of {b.quota} left
                        </p>
                      </div>
                      <Progress
                        value={usedPct}
                        aria-label={`${b.leaveType.name}: used ${b.used} of ${b.quota}`}
                      />
                      <p className="text-[11px] text-muted-foreground">{b.used} day{b.used === 1 ? '' : 's'} used this year</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My requests</CardTitle>
              <CardDescription>Every leave request you have filed, latest first.</CardDescription>
            </CardHeader>
            <CardContent>
              {!requests || requests.items.length === 0 ? (
                <EmptyState
                  icon={CalendarPlus}
                  title="No leave requests yet"
                  description="Apply for leave using the button above — your manager reviews it in the Leave Approvals queue."
                  className="py-8"
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead className="text-right">Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Review</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.items.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.leaveType.name}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(r.startDate)} → {formatDate(r.endDate)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{r.days}</TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} />
                          </TableCell>
                          <TableCell className="hidden max-w-56 md:table-cell">
                            {r.reviewNote ? (
                              <span className="block truncate text-xs text-muted-foreground" title={r.reviewNote}>
                                “{r.reviewNote}”
                                {r.reviewedByName ? ` — ${r.reviewedByName}` : ''}
                              </span>
                            ) : r.status === 'PENDING' ? (
                              <span className="text-xs text-muted-foreground italic">Awaiting review</span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.status === 'PENDING' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-9 gap-1 text-destructive hover:text-destructive"
                                onClick={() => void handleCancel(r)}
                                disabled={cancellingId === r.id}
                                aria-label={`Cancel ${r.leaveType.name} request for ${formatDate(r.startDate)}`}
                              >
                                {cancellingId === r.id ? (
                                  <Spinner className="size-3.5" />
                                ) : (
                                  <XCircle className="size-3.5" aria-hidden="true" />
                                )}
                                Cancel
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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
      )}

      {/* Apply dialog */}
      <Dialog open={applyOpen} onOpenChange={(o) => {
        if (!o) resetForm()
        setApplyOpen(o)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for leave</DialogTitle>
            <DialogDescription>Your request goes to the HR approvals queue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="leave-type" className="text-sm font-medium">
                Leave type
              </Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger id="leave-type" className="h-10 w-full" aria-label="Leave type">
                  <SelectValue placeholder="Select a leave type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => {
                    const bal = balancesById.get(t.id)
                    return (
                      <SelectItem key={t.id} value={t.id} disabled={bal !== undefined && bal.remaining <= 0}>
                        {t.name}
                        {bal ? ` — ${bal.remaining} left` : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {types.find((t) => t.id === leaveTypeId)?.description ? (
                <p className="text-xs text-muted-foreground">{types.find((t) => t.id === leaveTypeId)?.description}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="leave-start" className="text-sm font-medium">
                  Start date
                </Label>
                <Input
                  id="leave-start"
                  type="date"
                  min={minDate}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (endDate && e.target.value > endDate) setEndDate(e.target.value)
                  }}
                  className="h-10"
                  aria-label="Leave start date"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leave-end" className="text-sm font-medium">
                  End date
                </Label>
                <Input
                  id="leave-end"
                  type="date"
                  min={startDate || minDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                  aria-label="Leave end date"
                />
              </div>
            </div>
            {requestedDays > 0 && selectedBalance ? (
              <div
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm',
                  requestedDays > selectedBalance.remaining
                    ? 'border-destructive/40 bg-destructive/5 text-destructive'
                    : 'bg-muted/40 text-muted-foreground',
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Info className="size-4 shrink-0" aria-hidden="true" />
                  {requestedDays} calendar day{requestedDays === 1 ? '' : 's'} requested
                </span>
                <span className="tabular-nums text-xs">
                  {selectedBalance.remaining} available in {selectedBalance.leaveType.name}
                </span>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="leave-reason" className="text-sm font-medium">
                Reason
              </Label>
              <Textarea
                id="leave-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Short note for your approver…"
                className="min-h-20"
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => (setApplyOpen(false), resetForm())} disabled={submitting}>
              Cancel
            </Button>
            <Button className="min-h-11 gap-1.5" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? <Spinner className="size-4" /> : <CalendarPlus className="size-4" aria-hidden="true" />}
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
