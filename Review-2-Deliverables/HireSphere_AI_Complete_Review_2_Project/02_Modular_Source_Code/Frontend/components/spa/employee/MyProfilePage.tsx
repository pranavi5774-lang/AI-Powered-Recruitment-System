'use client'

// ============================================================
// My Profile (employee) — read-only personal + employment
// details and leave balances.
// Data: GET /api/employees/:id (id from auth/me employeeRecord).
// NOTE: PATCH /api/employees/:id is HR-only by contract — phone,
// address and emergency contact show a "contact HR" hint.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Home,
  IdCard,
  Info,
  Mail,
  Phone,
  ShieldAlert,
  Target,
  UserRound,
} from 'lucide-react'
import { get, ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/components/spa/shared/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  leaveBalances: {
    id: string
    year: number
    quota: number
    used: number
    leaveType: { id: string; name: string }
  }[]
}

export function MyProfilePage() {
  const me = useAuthStore((s) => s.user)
  const reduce = useReducedMotion()

  // AuthUser in the shared store types candidateProfile explicitly; the
  // employeeRecord for EMPLOYEE-role users arrives on the same payload, so
  // read it through a local view type (no shared-store edits needed).
  const employeeRecordId = (me as { employeeRecord?: { id: string } | null } | null)?.employeeRecord?.id

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // employeeRecord comes from /api/auth/me; the post-login user object
      // (login response) may not carry it, so resolve via /me when needed.
      let recordId = employeeRecordId
      if (!recordId) {
        const fresh = await get<{ user: { employeeRecord?: { id: string } | null } }>('/api/auth/me')
        recordId = fresh.user.employeeRecord?.id
      }
      if (!recordId) {
        setError('No employee record is linked to this account. Please contact HR.')
        return
      }
      setError(null)
      const data = await get<EmployeeDetail>(`/api/employees/${recordId}`)
      setEmployee(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your profile')
    } finally {
      setLoading(false)
    }
  }, [employeeRecordId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your employment record as maintained by HR. Some fields are HR-managed."
      />

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading || !employee ? (
        <div className="space-y-6" role="status" aria-live="polite">
          <div className="rounded-xl border bg-card p-6 space-y-4" aria-hidden="true">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
          <div className="rounded-xl border bg-card p-6 space-y-4" aria-hidden="true">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <span className="sr-only">Loading profile</span>
        </div>
      ) : (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2"
        >
          {/* Personal card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="size-4 text-primary" aria-hidden="true" />
                Personal details
              </CardTitle>
              <CardDescription>
                <span className="inline-flex items-center gap-1">
                  <ShieldAlert className="size-3.5 text-[var(--warning)]" aria-hidden="true" />
                  Phone, address and emergency contact are HR-managed — contact HR to update them.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1">
                <DetailRow icon={IdCard} label="Employee code" value={employee.employeeCode} />
                <DetailRow icon={UserRound} label="Full name" value={employee.name} />
                <DetailRow
                  icon={Mail}
                  label="Work email"
                  value={employee.workEmail}
                  hint="Protected"
                />
                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={employee.phone}
                  fallback="Not set — contact HR to add"
                  hint="Contact HR to update"
                />
                <DetailRow
                  icon={Home}
                  label="Address"
                  value={employee.address}
                  fallback="Not set — contact HR to add"
                  hint="Contact HR to update"
                />
                <DetailRow
                  icon={ShieldAlert}
                  label="Emergency contact"
                  value={employee.emergencyContact}
                  fallback="Not set — contact HR to add"
                  hint="Contact HR to update"
                />
                <DetailRow icon={CalendarDays} label="Joining date" value={formatDate(employee.joiningDate)} />
                <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
                  <dt className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="size-4" aria-hidden="true" />
                    Employment status
                  </dt>
                  <dd>
                    <StatusBadge status={employee.status} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Employment card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4 text-primary" aria-hidden="true" />
                  Employment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1">
                  <DetailRow icon={Building2} label="Department" value={employee.department?.name ?? null} fallback="Unassigned" />
                  <DetailRow icon={Target} label="Designation" value={employee.designation} />
                  <DetailRow icon={CalendarDays} label="Joined on" value={formatDate(employee.joiningDate)} />
                </dl>
                <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-dashed p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Department, designation and status changes are made by HR. Raise a request with
                  your HR partner if something looks wrong.
                </p>
              </CardContent>
            </Card>

            {/* Leave balances table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leave balances ({new Date().getUTCFullYear()})</CardTitle>
                <CardDescription>Remaining time off per leave type.</CardDescription>
              </CardHeader>
              <CardContent>
                {employee.leaveBalances.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No leave balances configured yet — HR assigns them per leave type.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Leave type</TableHead>
                          <TableHead className="text-right">Used</TableHead>
                          <TableHead className="text-right">Quota</TableHead>
                          <TableHead className="w-1/3">Remaining</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employee.leaveBalances.map((b) => {
                          const remaining = Math.max(0, b.quota - b.used)
                          const pct = b.quota > 0 ? Math.round((remaining / b.quota) * 100) : 0
                          return (
                            <TableRow key={b.id}>
                              <TableCell className="font-medium">{b.leaveType.name}</TableCell>
                              <TableCell className="text-right tabular-nums">{b.used}</TableCell>
                              <TableCell className="text-right tabular-nums">{b.quota}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={pct} className="h-1.5 flex-1" aria-label={`${b.leaveType.name} remaining ${remaining} of ${b.quota}`} />
                                  <span className="w-6 text-right text-xs font-medium tabular-nums">{remaining}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label: rowLabel,
  value,
  fallback,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null | undefined
  fallback?: string
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <dt className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        {rowLabel}
      </dt>
      <dd className="min-w-0 text-right">
        <span className={value ? 'break-words text-sm font-medium' : 'text-sm text-muted-foreground italic'}>
          {value || fallback || '—'}
        </span>
        {!value && hint ? (
          <span className="block text-[11px] text-muted-foreground">{hint}</span>
        ) : null}
      </dd>
    </div>
  )
}
