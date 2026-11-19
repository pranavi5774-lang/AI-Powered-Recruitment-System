'use client'

// ============================================================
// Admin — User Management.
// Data: GET/POST /api/users, PATCH /api/users/[id]
// Role create limited to HR | ADMIN (server-enforced too).
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { KeyRound, ShieldQuestion, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import { get, patch, post } from '@/lib/api-client'
import type { ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { DataTable, type DataTableColumn, type SortState } from '@/components/spa/shared/DataTable'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime, initialsOf, label } from '@/components/spa/shared/formatters'

type UserRow = {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'HR' | 'CANDIDATE' | 'EMPLOYEE'
  status: 'ACTIVE' | 'SUSPENDED'
  phone: string | null
  lastLoginAt: string | null
  createdAt: string
}

const ROLE_OPTIONS = ['ALL', 'ADMIN', 'HR', 'CANDIDATE', 'EMPLOYEE'] as const
const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'SUSPENDED'] as const
const CREATE_ROLES = ['HR', 'ADMIN'] as const

function randomStrongPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%^&*'
  const pick = (set: string, n: number) =>
    Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join('')
  return `${pick(alphabet, 6)}${pick(digits, 3)}${pick(symbols, 2)}${pick(alphabet, 3)}`
}

export function UsersPage(_props: unknown) {
  const me = useAuthStore((s) => s.user)
  const reduce = useReducedMotion()

  // list state
  const [items, setItems] = React.useState<UserRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 10
  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [role, setRole] = React.useState<(typeof ROLE_OPTIONS)[number]>('ALL')
  const [status, setStatus] = React.useState<(typeof STATUS_OPTIONS)[number]>('ALL')

  // create dialog
  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', email: '', password: '', phone: '', role: 'HR' as (typeof CREATE_ROLES)[number] })

  // edit dialog
  const [editTarget, setEditTarget] = React.useState<UserRow | null>(null)
  const [editForm, setEditForm] = React.useState({ name: '', phone: '', role: 'HR' as UserRow['role'] })
  const [saving, setSaving] = React.useState(false)

  // debounce search
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
      if (role !== 'ALL') params.set('role', role)
      if (status !== 'ALL') params.set('status', status)
      const data = await get<{ items: UserRow[]; total: number; page: number; totalPages: number }>(
        `/api/users?${params.toString()}`,
      )
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, role, status])

  React.useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setForm({ name: '', email: '', password: randomStrongPassword(), phone: '', role: 'HR' })
    setCreateOpen(true)
  }

  const submitCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Name, email and password are required.')
      return
    }
    setCreating(true)
    try {
      await post('/api/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        role: form.role,
      })
      toast.success(`User ${form.name.trim()} created as ${label(form.role)}. Share the password securely — it is only shown here.`)
      setCreateOpen(false)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create user')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (u: UserRow) => {
    setEditTarget(u)
    setEditForm({ name: u.name, phone: u.phone ?? '', role: u.role })
  }

  const submitEdit = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      const body: Record<string, string> = { name: editForm.name.trim() }
      if (editForm.phone.trim()) body.phone = editForm.phone.trim()
      if (editForm.role !== editTarget.role) body.role = editForm.role
      await patch(`/api/users/${editTarget.id}`, body)
      toast.success('User updated.')
      setEditTarget(null)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update user')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (u: UserRow) => {
    const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const okToGo = await confirmDialog({
      title: next === 'SUSPENDED' ? `Suspend ${u.name}?` : `Reactivate ${u.name}?`,
      description:
        next === 'SUSPENDED'
          ? 'The account will be blocked from signing in immediately. You can reactivate it later.'
          : 'The account will be able to sign in again.',
      confirmText: next === 'SUSPENDED' ? 'Suspend' : 'Reactivate',
      destructive: next === 'SUSPENDED',
    })
    if (!okToGo) return
    try {
      await patch(`/api/users/${u.id}`, { status: next })
      toast.success(`${u.name} is now ${next === 'SUSPENDED' ? 'suspended' : 'active'}.`)
      void load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update status'
      const code = (e as ApiError).code
      toast.error(code === 'CANNOT_MODIFY_SELF' ? 'You cannot change your own account status.' : msg)
    }
  }

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
            aria-hidden="true"
          >
            {initialsOf(u.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{u.name}</p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u) => <Badge variant="outline" className="font-medium">{label(u.role)}</Badge>,
    },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'phone',
      header: 'Phone',
      hideOnMobile: true,
      render: (u) => u.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'lastLoginAt',
      header: 'Last login',
      sortable: true,
      hideOnMobile: true,
      render: (u) => (
        <span className="text-muted-foreground">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      hideOnMobile: true,
      render: (u) => <span className="text-muted-foreground">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" className="h-8" onClick={() => openEdit(u)} aria-label={`Edit ${u.name}`}>
            Edit
          </Button>
          {u.id !== me?.id && (
            <Button
              variant="ghost"
              size="sm"
              className={u.status === 'ACTIVE' ? 'h-8 text-destructive hover:text-destructive' : 'h-8 text-[var(--success)]'}
              onClick={() => void toggleStatus(u)}
              aria-label={u.status === 'ACTIVE' ? `Suspend ${u.name}` : `Reactivate ${u.name}`}
            >
              {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  const [sort, setSort] = React.useState<SortState | undefined>(undefined)

  // Client-side sort within the current page (page-level sorting).
  const sortedItems = React.useMemo(() => {
    if (!sort) return items
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      const key = sort.key as keyof UserRow
      const av = a[key]
      const bv = b[key]
      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [items, sort])

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Staff accounts, roles and access. Candidate and employee logins are managed automatically."
        actions={
          <Button size="sm" className="min-h-9 gap-1.5" onClick={openCreate}>
            <UserPlus className="size-4" aria-hidden="true" />
            Create user
          </Button>
        }
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <DataTable<UserRow>
          columns={columns}
          items={sortedItems}
          rowKey={(u) => u.id}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No users match these filters"
          emptyDescription="Try clearing the search or changing the role/status filter."
          emptyAction={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchInput('')
                setRole('ALL')
                setStatus('ALL')
              }}
            >
              Clear filters
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
                value={role}
                onValueChange={(v) => {
                  setRole(v as (typeof ROLE_OPTIONS)[number])
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-36" aria-label="Filter by role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === 'ALL' ? 'All roles' : label(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as (typeof STATUS_OPTIONS)[number])
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-36" aria-label="Filter by status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'ALL' ? 'All statuses' : label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
      </motion.div>

      {/* ---- Create user dialog ---- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-4 text-primary" aria-hidden="true" />
              Create staff user
            </DialogTitle>
            <DialogDescription>
              Staff roles only (HR or Admin). Candidates register themselves from the public sign-up.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="u-name">Full name</Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Recruiter Three"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u-email">Email</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@hiresphere.ai"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="u-role">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as (typeof CREATE_ROLES)[number] })}>
                  <SelectTrigger id="u-role" aria-label="Role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {label(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="u-phone">Phone (optional)</Label>
                <Input
                  id="u-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 …"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="u-password" className="flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Temporary password
              </Label>
              <div className="flex gap-2">
                <Input
                  id="u-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-9 gap-1.5"
                  onClick={() => setForm({ ...form, password: randomStrongPassword() })}
                >
                  <ShieldQuestion className="size-4" aria-hidden="true" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A strong password is pre-generated. Copy it now — it is stored hashed and cannot be viewed again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void submitCreate()} disabled={creating} className="min-h-9">
              {creating ? 'Creating…' : 'Create user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Edit user dialog ---- */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              {editTarget?.email}
              {editTarget?.id === me?.id ? ' — this is your own account.' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="e-name">Full name</Label>
              <Input id="e-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-phone">Phone</Label>
              <Input id="e-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="e-role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm({ ...editForm, role: v as UserRow['role'] })}
                disabled={editTarget?.id === me?.id}
              >
                <SelectTrigger id="e-role" aria-label="Role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['ADMIN', 'HR', 'CANDIDATE', 'EMPLOYEE'] as const).map((r) => (
                    <SelectItem key={r} value={r}>
                      {label(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editTarget?.id === me?.id ? (
                <p className="text-xs text-muted-foreground">You cannot change your own role or status.</p>
              ) : null}
            </div>
          </div>
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
