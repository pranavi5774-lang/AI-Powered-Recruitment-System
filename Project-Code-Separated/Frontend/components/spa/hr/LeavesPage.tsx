'use client'

// ============================================================
// HR — Leave approvals + leave-type management + balances.
// Data: GET /api/leaves/requests?status=…, /api/leaves/types,
//       /api/leaves/balances?employeeId=
// Decide: PATCH /api/leaves/requests/[id] { status, reviewNote }
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarDays, Check, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import { get, patch, post } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { DataTable, type DataTableColumn } from '@/components/spa/shared/DataTable'
import { EmptyState } from '@/components/spa/shared/EmptyState'
import { SkeletonRows } from '@/components/spa/shared/Loading'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/components/spa/shared/formatters'

type LeaveRow = {
  id: string
  employee: { id: string; name: string; employeeCode: string }
  leaveType: { id: string; name: string }
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  createdAt: string
  reviewedByName: string | null
  reviewNote: string | null
}

type LeaveType = { id: string; name: string; annualQuota: number; description: string | null }

type BalanceResp = {
  year: number
  employee: { id: string; name: string; employeeCode: string }
  items: { id: string; quota: number; used: number; leaveType: { id: string; name: string } }[]
}

const TAB_STATUS: Record<string, string | undefined> = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  cancelled: 'CANCELLED',
  all: undefined,
}

export function LeavesPage(_props: unknown) {
  const [tab, setTab] = React.useState('pending')
  const [items, setItems] = React.useState<LeaveRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 10
  const reduce = useReducedMotion()

  // decision dialog
  const [decision, setDecision] = React.useState<{ row: LeaveRow; status: 'APPROVED' | 'REJECTED' } | null>(null)
  const [decisionNote, setDecisionNote] = React.useState('')
  const [deciding, setDeciding] = React.useState(false)

  // leave types
  const [types, setTypes] = React.useState<LeaveType[]>([])
  const [typeOpen, setTypeOpen] = React.useState(false)
  const [typeForm, setTypeForm] = React.useState({ name: '', annualQuota: '12', description: '' })
  const [typeSaving, setTypeSaving] = React.useState(false)

  // balances
  const [employees, setEmployees] = React.useState<{ id: string; name: string; employeeCode: string }[]>([])
  const [balanceFor, setBalanceFor] = React.useState('')
  const [balances, setBalances] = React.useState<BalanceResp | null>(null)
  const [balLoading, setBalLoading] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const status = TAB_STATUS[tab]
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (status) params.set('status', status)
      const data = await get<{ items: LeaveRow[]; total: number; totalPages: number }>(
        `/api/leaves/requests?${params.toString()}`,
      )
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leave requests')
    } finally {
      setLoading(false)
    }
  }, [tab, page])

  const loadTypes = React.useCallback(async () => {
    try {
      const data = await get<{ items: LeaveType[] }>('/api/leaves/types')
      setTypes(data.items)
    } catch {
      // section is supplementary
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])
  React.useEffect(() => {
    void loadTypes()
  }, [loadTypes])

  React.useEffect(() => {
    const run = async () => {
      try {
        const data = await get<{ items: { id: string; name: string; employeeCode: string }[] }>('/api/employees?pageSize=100')
        setEmployees(data.items)
        if (data.items.length > 0) setBalanceFor((cur) => cur || data.items[0].id)
      } catch {
        // optional
      }
    }
    void run()
  }, [])

  React.useEffect(() => {
    if (!balanceFor) return
    let cancelled = false
    const run = async () => {
      setBalLoading(true)
      try {
        const data = await get<BalanceResp>(`/api/leaves/balances?employeeId=${balanceFor}`)
        if (!cancelled) setBalances(data)
      } catch {
        if (!cancelled) setBalances(null)
      } finally {
        if (!cancelled) setBalLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [balanceFor])

  const openDecision = (row: LeaveRow, status: 'APPROVED' | 'REJECTED') => {
    setDecision({ row, status })
    setDecisionNote('')
  }

  const submitDecision = async () => {
    if (!decision) return
    setDeciding(true)
    try {
      await patch(`/api/leaves/requests/${decision.row.id}`, {
        status: decision.status,
        reviewNote: decisionNote.trim() || undefined,
      })
      toast.success(
        decision.status === 'APPROVED'
          ? `Approved — ${decision.row.employee.name} notified and balance updated.`
          : `Rejected — ${decision.row.employee.name} notified.`,
      )
      setDecision(null)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the request')
    } finally {
      setDeciding(false)
    }
  }

  const submitType = async () => {
    if (!typeForm.name.trim()) {
      toast.error('Leave type name is required.')
      return
    }
    const quota = Number(typeForm.annualQuota)
    if (!Number.isFinite(quota) || quota < 0) {
      toast.error('Annual quota must be a non-negative number.')
      return
    }
    setTypeSaving(true)
    try {
      await post('/api/leaves/types', {
        name: typeForm.name.trim(),
        annualQuota: quota,
        description: typeForm.description.trim() || undefined,
      })
      toast.success(`Leave type “${typeForm.name.trim()}” created.`)
      setTypeOpen(false)
      setTypeForm({ name: '', annualQuota: '12', description: '' })
      void loadTypes()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the leave type')
    } finally {
      setTypeSaving(false)
    }
  }

  const cancelRequest = async (row: LeaveRow) => {
    const okToGo = await confirmDialog({
      title: 'Cancel this leave request?',
      description: `${row.employee.name} — ${row.leaveType.name}. Cancelled requests can be resubmitted by the employee.`,
      confirmText: 'Cancel request',
      destructive: true,
    })
    if (!okToGo) return
    try {
      await patch(`/api/leaves/requests/${row.id}`, { status: 'CANCELLED' })
      toast.success('Request cancelled.')
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not cancel the request')
    }
  }

  const columns: DataTableColumn<LeaveRow>[] = [
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
    {
      key: 'leaveType',
      header: 'Type',
      render: (r) => <span className="truncate">{r.leaveType.name}</span>,
    },
    {
      key: 'range',
      header: 'Range',
      render: (r) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(r.startDate)} → {formatDate(r.endDate)}
        </span>
      ),
    },
    { key: 'days', header: 'Days', render: (r) => <span className="tabular-nums">{r.days}</span> },
    {
      key: 'reason',
      header: 'Reason',
      wrap: true,
      hideOnMobile: true,
      render: (r) => <span className="line-clamp-2 text-muted-foreground">{r.reason}</span>,
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'createdAt',
      header: 'Applied',
      hideOnMobile: true,
      render: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'review',
      header: 'Review',
      hideOnMobile: true,
      render: (r) =>
        r.reviewedByName ? (
          <span className="text-xs text-muted-foreground">
            {r.reviewedByName}
            {r.reviewNote ? ` — “${r.reviewNote}”` : ''}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) =>
        r.status === 'PENDING' ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="icon"
              className="size-8"
              onClick={() => openDecision(r, 'APPROVED')}
              aria-label={`Approve leave of ${r.employee.name}`}
            >
              <Check className="size-4" aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => openDecision(r, 'REJECTED')}
              aria-label={`Reject leave of ${r.employee.name}`}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : r.status === 'APPROVED' || r.status === 'REJECTED' ? (
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => void cancelRequest(r)}>
            Cancel
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Approvals"
        description="Review requests, manage leave types and check balances. Approved days increment the employee's used quota."
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v)
          setPage(1)
        }}
      >
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="pending" className="min-h-9">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="min-h-9">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="min-h-9">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="min-h-9">
            Cancelled
          </TabsTrigger>
          <TabsTrigger value="all" className="min-h-9">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
          <motion.div initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <DataTable<LeaveRow>
              columns={columns}
              items={items}
              rowKey={(r) => r.id}
              loading={loading}
              error={error}
              onRetry={() => void load()}
              emptyTitle="No leave requests here"
              emptyDescription={
                tab === 'pending'
                  ? 'The queue is clear — new requests will appear immediately.'
                  : 'No requests match this status.'
              }
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </motion.div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- Leave types ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                Leave types
              </span>
              <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => setTypeOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Add type
              </Button>
            </CardTitle>
            <CardDescription>Annual quotas per type. Balances are generated per employee per year.</CardDescription>
          </CardHeader>
          <CardContent>
            {types.length === 0 ? (
              <EmptyState title="No leave types yet" description="Create the first type, e.g. Annual Leave with an 18-day quota." />
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 scroll-slim">
                {types.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.name}</p>
                      {t.description ? <p className="truncate text-xs text-muted-foreground">{t.description}</p> : null}
                    </div>
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                      {t.annualQuota} days/yr
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ---- Balances for selected employee ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balances by employee</CardTitle>
            <CardDescription>Pick an employee to inspect this year's quota usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={balanceFor || undefined}
              onValueChange={(v) => setBalanceFor(v)}
              disabled={employees.length === 0}
            >
              <SelectTrigger aria-label="Select employee" className="max-w-sm">
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
            {balLoading ? (
              <SkeletonRows rows={3} />
            ) : balances && balances.items.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Type</TableHead>
                      <TableHead>Quota</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.items.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.leaveType.name}</TableCell>
                        <TableCell className="tabular-nums">{b.quota}</TableCell>
                        <TableCell className="tabular-nums">{b.used}</TableCell>
                        <TableCell className="tabular-nums">{Math.max(0, b.quota - b.used)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {balances ? 'No balances for this employee/year yet.' : 'Balances appear once created.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- decision dialog ---- */}
      <Dialog open={decision !== null} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decision?.status === 'APPROVED' ? 'Approve leave request' : 'Reject leave request'}
            </DialogTitle>
            <DialogDescription>
              {decision
                ? `${decision.row.employee.name} — ${decision.row.leaveType.name}, ${decision.row.days} day${
                    decision.row.days === 1 ? '' : 's'
                  } (${formatDate(decision.row.startDate)} → ${formatDate(decision.row.endDate)}).`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="dec-note">Review note (shared with the employee)</Label>
              <Textarea
                id="dec-note"
                rows={3}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="e.g. Approved — please update the team calendar."
              />
            </div>
            {decision?.status === 'APPROVED' ? (
              <p className="text-xs text-muted-foreground">
                On approval the employee's used balance is incremented and LEAVE attendance rows are created for the
                range.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)} className="min-h-9">
              Cancel
            </Button>
            <Button
              onClick={() => void submitDecision()}
              disabled={deciding}
              className={decision?.status === 'REJECTED' ? 'min-h-9 bg-destructive text-white hover:bg-destructive/90' : 'min-h-9'}
            >
              {deciding ? 'Saving…' : decision?.status === 'APPROVED' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- add leave type dialog ---- */}
      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add leave type</DialogTitle>
            <DialogDescription>New types become selectable for employees immediately.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="lt-name">Name *</Label>
              <Input id="lt-name" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="e.g. Marriage Leave" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lt-quota">Annual quota (days) *</Label>
              <Input
                id="lt-quota"
                type="number"
                min={0}
                value={typeForm.annualQuota}
                onChange={(e) => setTypeForm({ ...typeForm, annualQuota: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lt-desc">Description</Label>
              <Textarea id="lt-desc" rows={2} value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitType()} disabled={typeSaving} className="min-h-9">
              {typeSaving ? 'Creating…' : 'Create type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
