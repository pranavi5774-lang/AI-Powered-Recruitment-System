'use client'

// ============================================================
// HR — Performance reviews.
// Data: GET /api/performance?employeeId=…
// Create: POST /api/performance   Edit: PATCH /api/performance/[id]
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Pencil, Plus, Star } from 'lucide-react'
import { toast } from 'sonner'

import { get, post, patch } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/spa/shared/DataTable'
import { EmptyState } from '@/components/spa/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/components/spa/shared/formatters'
import { cn } from '@/lib/utils'

type ReviewRow = {
  id: string
  employeeId: string
  employee: { id: string; name: string; employeeCode: string }
  reviewerId: string
  reviewerName: string
  period: string
  reviewDate: string
  rating: number
  goals: string
  achievements: string
  feedback: string
  strengths: string | null
  areasToImprove: string | null
}

type EmployeeOption = { id: string; name: string; employeeCode: string }

const RATING_CAPTIONS: Record<number, string> = {
  1: '1 — Needs significant improvement',
  2: '2 — Below expectations',
  3: '3 — Meets expectations',
  4: '4 — Exceeds expectations',
  5: '5 — Outstanding',
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-4',
            i < rating ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-muted-foreground/40',
          )}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

const EMPTY_FORM = {
  employeeId: '',
  period: `${new Date().getFullYear()}-H2`,
  reviewDate: new Date().toISOString().slice(0, 10),
  rating: '3',
  goals: '',
  achievements: '',
  feedback: '',
  strengths: '',
  areasToImprove: '',
}

export function PerformancePage(_props: unknown) {
  const [items, setItems] = React.useState<ReviewRow[]>([])
  const [employees, setEmployees] = React.useState<EmployeeOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 10
  const [employeeFilter, setEmployeeFilter] = React.useState('ALL')
  const reduce = useReducedMotion()

  // create dialog
  const [createOpen, setCreateOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState(EMPTY_FORM)

  // edit dialog
  const [editTarget, setEditTarget] = React.useState<ReviewRow | null>(null)
  const [editForm, setEditForm] = React.useState(EMPTY_FORM)

  React.useEffect(() => {
    const run = async () => {
      try {
        const data = await get<{ items: EmployeeOption[] }>('/api/employees?pageSize=100')
        setEmployees(data.items)
        if (data.items.length > 0) setForm((f) => ({ ...f, employeeId: f.employeeId || data.items[0].id }))
      } catch {
        // filter optional
      }
    }
    void run()
  }, [])

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (employeeFilter !== 'ALL') params.set('employeeId', employeeFilter)
      const data = await get<{ items: ReviewRow[]; total: number; totalPages: number }>(
        `/api/performance?${params.toString()}`,
      )
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [page, employeeFilter])

  React.useEffect(() => {
    void load()
  }, [load])

  const submitCreate = async () => {
    if (!form.employeeId) {
      toast.error('Select the employee being reviewed.')
      return
    }
    if (!form.period.trim() || !form.goals.trim() || !form.achievements.trim() || !form.feedback.trim()) {
      toast.error('Period, goals, achievements and feedback are required.')
      return
    }
    setSaving(true)
    try {
      await post('/api/performance', {
        employeeId: form.employeeId,
        period: form.period.trim(),
        reviewDate: form.reviewDate,
        rating: Number(form.rating),
        goals: form.goals.trim(),
        achievements: form.achievements.trim(),
        feedback: form.feedback.trim(),
        strengths: form.strengths.trim() || undefined,
        areasToImprove: form.areasToImprove.trim() || undefined,
      })
      toast.success('Performance review recorded.')
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the review')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (r: ReviewRow) => {
    setEditTarget(r)
    setEditForm({
      employeeId: r.employeeId,
      period: r.period,
      reviewDate: r.reviewDate?.slice(0, 10) ?? '',
      rating: String(r.rating),
      goals: r.goals,
      achievements: r.achievements,
      feedback: r.feedback,
      strengths: r.strengths ?? '',
      areasToImprove: r.areasToImprove ?? '',
    })
  }

  const submitEdit = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      await patch(`/api/performance/${editTarget.id}`, {
        period: editForm.period.trim(),
        reviewDate: editForm.reviewDate,
        rating: Number(editForm.rating),
        goals: editForm.goals.trim(),
        achievements: editForm.achievements.trim(),
        feedback: editForm.feedback.trim(),
        strengths: editForm.strengths.trim() || undefined,
        areasToImprove: editForm.areasToImprove.trim() || undefined,
      })
      toast.success('Review updated.')
      setEditTarget(null)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the review')
    } finally {
      setSaving(false)
    }
  }

  const columns: DataTableColumn<ReviewRow>[] = [
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
      key: 'period',
      header: 'Period',
      render: (r) => <span className="font-medium">{r.period}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Stars rating={r.rating} />
          <span className="text-xs tabular-nums text-muted-foreground">{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'reviewerName',
      header: 'Reviewer',
      hideOnMobile: true,
      render: (r) => <span className="text-muted-foreground">{r.reviewerName}</span>,
    },
    {
      key: 'reviewDate',
      header: 'Date',
      hideOnMobile: true,
      render: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(r.reviewDate)}</span>,
    },
    {
      key: 'goals',
      header: 'Goals',
      wrap: true,
      hideOnMobile: true,
      render: (r) => <span className="line-clamp-2 text-muted-foreground">{r.goals}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => openEdit(r)} aria-label={`Edit review of ${r.employee.name} for ${r.period}`}>
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>
      ),
    },
  ]

  const reviewFormFields = (
    formState: typeof form,
    setFormState: (f: typeof form) => void,
    employeeDisabled: boolean,
  ) => (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>Employee *</Label>
          <Select
            value={formState.employeeId || undefined}
            onValueChange={(v) => setFormState({ ...formState, employeeId: v })}
            disabled={employeeDisabled}
          >
            <SelectTrigger aria-label="Employee">
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
        <div className="grid gap-2">
          <Label htmlFor="pf-period">Period *</Label>
          <Input
            id="pf-period"
            value={formState.period}
            onChange={(e) => setFormState({ ...formState, period: e.target.value })}
            placeholder="e.g. 2026-H2"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pf-date">Review date</Label>
          <Input
            id="pf-date"
            type="date"
            value={formState.reviewDate}
            onChange={(e) => setFormState({ ...formState, reviewDate: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Rating *</Label>
        <Select value={formState.rating} onValueChange={(v) => setFormState({ ...formState, rating: v })}>
          <SelectTrigger aria-label="Rating">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {RATING_CAPTIONS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Stars rating={Number(formState.rating)} />
          <span className="text-xs text-muted-foreground">{RATING_CAPTIONS[Number(formState.rating)]}</span>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="pf-goals">Goals *</Label>
        <Textarea id="pf-goals" rows={2} value={formState.goals} onChange={(e) => setFormState({ ...formState, goals: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="pf-ach">Achievements *</Label>
        <Textarea id="pf-ach" rows={2} value={formState.achievements} onChange={(e) => setFormState({ ...formState, achievements: e.target.value })} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="pf-fb">Feedback *</Label>
        <Textarea id="pf-fb" rows={2} value={formState.feedback} onChange={(e) => setFormState({ ...formState, feedback: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="pf-str">Strengths</Label>
          <Textarea id="pf-str" rows={2} value={formState.strengths} onChange={(e) => setFormState({ ...formState, strengths: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pf-imp">Areas to improve</Label>
          <Textarea id="pf-imp" rows={2} value={formState.areasToImprove} onChange={(e) => setFormState({ ...formState, areasToImprove: e.target.value })} />
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description="Periodic reviews with ratings, goals and growth feedback. Reviews are audited and attributable to you as reviewer."
        actions={
          <Button
            size="sm"
            className="min-h-9 gap-1.5"
            onClick={() => {
              setForm(EMPTY_FORM)
              setCreateOpen(true)
            }}
            disabled={employees.length === 0}
          >
            <Plus className="size-4" aria-hidden="true" />
            New Review
          </Button>
        }
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <DataTable<ReviewRow>
          columns={columns}
          items={items}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No reviews yet"
          emptyDescription="Create the first review to start building the performance history."
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          toolbar={
            <Select
              value={employeeFilter}
              onValueChange={(v) => {
                setEmployeeFilter(v)
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
          }
        />
      </motion.div>

      {/* ---- create dialog ---- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New performance review</DialogTitle>
            <DialogDescription>Ratings follow the 1–5 criteria captions; the review is attributed to you.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">{reviewFormFields(form, setForm, false)}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitCreate()} disabled={saving} className="min-h-9">
              {saving ? 'Saving…' : 'Save review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- edit dialog ---- */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit review</DialogTitle>
            <DialogDescription>
              {editTarget ? `${editTarget.employee.name} — ${editTarget.period} (by ${editTarget.reviewerName})` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">{reviewFormFields(editForm, setEditForm, true)}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitEdit()} disabled={saving} className="min-h-9">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
