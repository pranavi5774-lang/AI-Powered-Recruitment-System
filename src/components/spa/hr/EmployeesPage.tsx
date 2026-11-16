'use client'

// ============================================================
// HR — Employees list.
// Data: GET /api/employees?search=&departmentId=&status=…
// Create: POST /api/employees (direct hires without a pipeline)
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarOff, IdCard, UserPlus, UserRoundCheck, UserRoundSearch, Users } from 'lucide-react'
import { toast } from 'sonner'

import { get, post } from '@/lib/api-client'
import { EMPLOYEE_STATUS } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatCard } from '@/components/spa/shared/StatCard'
import { DataTable, type DataTableColumn, type SortState } from '@/components/spa/shared/DataTable'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, label } from '@/components/spa/shared/formatters'

type EmployeeRow = {
  id: string
  employeeCode: string
  name: string
  workEmail: string
  phone: string | null
  designation: string
  joiningDate: string
  status: string
  department: { id: string; name: string } | null
  _count: { attendance: number; leaveRequests: number; reviews: number }
}

type Department = { id: string; name: string }

export function EmployeesPage(_props: unknown) {
  const [items, setItems] = React.useState<EmployeeRow[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 10
  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [deptFilter, setDeptFilter] = React.useState('ALL')
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [counts, setCounts] = React.useState<{ total: number; active: number; probation: number; onLeave: number } | null>(null)
  const [sort, setSort] = React.useState<SortState | undefined>(undefined)

  // create dialog
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    workEmail: '',
    phone: '',
    departmentId: 'NONE',
    designation: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE',
  })
  const reduce = useReducedMotion()

  React.useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search) params.set('search', search)
      if (deptFilter !== 'ALL') params.set('departmentId', deptFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      const data = await get<{ items: EmployeeRow[]; total: number; totalPages: number }>(
        `/api/employees?${params.toString()}`,
      )
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [page, search, deptFilter, statusFilter])

  const loadCounts = React.useCallback(async () => {
    try {
      const [all, active, probation, onLeave] = await Promise.all([
        get<{ total: number }>('/api/employees?pageSize=1'),
        get<{ total: number }>('/api/employees?status=ACTIVE&pageSize=1'),
        get<{ total: number }>('/api/employees?status=ON_PROBATION&pageSize=1'),
        get<{ total: number }>('/api/employees?status=ON_LEAVE&pageSize=1'),
      ])
      setCounts({ total: all.total, active: active.total, probation: probation.total, onLeave: onLeave.total })
    } catch {
      // decorative counts
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])
  React.useEffect(() => {
    void loadCounts()
  }, [loadCounts])

  React.useEffect(() => {
    const loadDepts = async () => {
      try {
        const data = await get<{ items: Department[] }>('/api/departments')
        setDepartments(data.items)
      } catch {
        // optional filter
      }
    }
    void loadDepts()
  }, [])

  const submitCreate = async () => {
    if (!form.name.trim() || !form.workEmail.trim() || !form.designation.trim()) {
      toast.error('Name, work email and designation are required.')
      return
    }
    setSaving(true)
    try {
      const created = await post<{ id: string; employeeCode: string }>('/api/employees', {
        name: form.name.trim(),
        workEmail: form.workEmail.trim(),
        phone: form.phone.trim() || undefined,
        departmentId: form.departmentId !== 'NONE' ? form.departmentId : undefined,
        designation: form.designation.trim(),
        joiningDate: form.joiningDate || undefined,
        status: form.status,
      })
      toast.success(`Employee created with code ${created.employeeCode}.`)
      setOpen(false)
      void load()
      void loadCounts()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the employee')
    } finally {
      setSaving(false)
    }
  }

  const sortedItems = React.useMemo(() => {
    if (!sort) return items
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      const get = (e: EmployeeRow): string | number | null => {
        switch (sort.key) {
          case 'employeeCode':
            return e.employeeCode
          case 'name':
            return e.name
          case 'designation':
            return e.designation
          case 'department':
            return e.department?.name ?? null
          case 'joiningDate':
            return e.joiningDate
          case 'status':
            return e.status
          default:
            return null
        }
      }
      const av = get(a)
      const bv = get(b)
      if (av === bv) return 0
      if (av === null) return 1
      if (bv === null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [items, sort])

  const columns: DataTableColumn<EmployeeRow>[] = [
    {
      key: 'employeeCode',
      header: 'Code',
      sortable: true,
      render: (e) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{e.employeeCode}</code>,
    },
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{e.name}</p>
          <p className="truncate text-xs text-muted-foreground">{e.workEmail}</p>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      sortable: true,
      render: (e) => <span className="truncate">{e.designation}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (e) => <span className="text-muted-foreground">{e.department?.name ?? '—'}</span>,
    },
    {
      key: 'joiningDate',
      header: 'Joined',
      sortable: true,
      hideOnMobile: true,
      render: (e) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(e.joiningDate)}</span>,
    },
    { key: 'status', header: 'Status', sortable: true, render: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (e) => (
        <Button asChild variant="ghost" size="sm" className="h-8" aria-label={`Open profile of ${e.name}`}>
          <a href={`#/hr/employees/${e.id}`}>View</a>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Directory of everyone on the payroll. Hired candidates land here automatically."
        actions={
          <Button size="sm" className="min-h-9 gap-1.5" onClick={() => setOpen(true)}>
            <UserPlus className="size-4" aria-hidden="true" />
            Create Employee
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total employees" value={counts?.total ?? '—'} hint="All records" index={0} />
        <StatCard icon={UserRoundCheck} label="Active" value={counts?.active ?? '—'} hint="Currently working" index={1} />
        <StatCard icon={UserRoundSearch} label="On probation" value={counts?.probation ?? '—'} hint="Under review period" index={2} />
        <StatCard icon={CalendarOff} label="On leave" value={counts?.onLeave ?? '—'} hint="Approved leave right now" index={3} />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <DataTable<EmployeeRow>
          columns={columns}
          items={sortedItems}
          rowKey={(e) => e.id}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No employees found"
          emptyDescription="Adjust the filters or create the first employee record."
          emptyAction={
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              <IdCard className="size-4" aria-hidden="true" />
              Create employee
            </Button>
          }
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by name…"
          sort={sort}
          onSortChange={setSort}
          toolbar={
            <>
              <Select
                value={deptFilter}
                onValueChange={(v) => {
                  setDeptFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-44" aria-label="Filter by department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-40" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {EMPLOYEE_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
      </motion.div>

      {/* ---- Create employee dialog ---- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create employee record</DialogTitle>
            <DialogDescription>
              For direct hires outside the recruitment pipeline. Hired candidates are converted automatically from their
              application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="emp-name">Full name *</Label>
                <Input id="emp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp-email">Work email *</Label>
                <Input
                  id="emp-email"
                  type="email"
                  placeholder="name@hiresphere.ai"
                  value={form.workEmail}
                  onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="emp-desig">Designation *</Label>
                <Input
                  id="emp-desig"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp-phone">Phone</Label>
                <Input id="emp-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="emp-dept">Department</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger id="emp-dept" aria-label="Department">
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
                <Label htmlFor="emp-date">Joining date</Label>
                <Input
                  id="emp-date"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp-status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="emp-status" aria-label="Status">
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
            <p className="text-xs text-muted-foreground">
              An employee code (HS-EMP-####) is generated automatically.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitCreate()} disabled={saving} className="min-h-9">
              {saving ? 'Creating…' : 'Create employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
