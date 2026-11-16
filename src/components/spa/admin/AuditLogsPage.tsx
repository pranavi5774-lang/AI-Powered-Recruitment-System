'use client'

// ============================================================
// Admin — Audit Logs (ADMIN only endpoint).
// Data: GET /api/audit-logs?entityType=&action=&search=…
// `search` matches the actor name (server-side).
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ScrollText } from 'lucide-react'

import { get } from '@/lib/api-client'
import { AUDIT_ENTITY_TYPES } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { DataTable, type DataTableColumn } from '@/components/spa/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime, label } from '@/components/spa/shared/formatters'

type AuditRow = {
  id: string
  actorId: string
  actorName: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  details: string | null
  ip: string | null
  createdAt: string
}

/** Frequently used action codes for quick filtering (server matches exact). */
const COMMON_ACTIONS = [
  'AUTH_LOGIN',
  'AUTH_REGISTER',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'JOB_CREATED',
  'JOB_PUBLISHED',
  'JOB_CLOSED',
  'JOB_DELETED',
  'APPLICATION_SUBMITTED',
  'APPLICATION_STATUS_CHANGED',
  'AI_ANALYSIS_RUN',
  'INTERVIEW_SCHEDULED',
  'EMPLOYEE_CREATED',
  'EMPLOYEE_CREATED_FROM_HIRE',
  'EMPLOYEE_UPDATED',
  'ATTENDANCE_RECORDED',
  'ATTENDANCE_CORRECTED',
  'LEAVE_REQUESTED',
  'LEAVE_DECISION',
  'PERFORMANCE_REVIEW_CREATED',
  'RESUME_UPLOADED',
  'REPORT_EXPORTED',
  'SETTING_UPDATED',
] as const

function prettyDetails(raw: string | null): string {
  if (!raw) return '—'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export function AuditLogsPage(_props: unknown) {
  const [items, setItems] = React.useState<AuditRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 12

  const [searchInput, setSearchInput] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [entityType, setEntityType] = React.useState('ALL')
  const [action, setAction] = React.useState('ALL')
  const [detail, setDetail] = React.useState<AuditRow | null>(null)
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
      if (entityType !== 'ALL') params.set('entityType', entityType)
      if (action !== 'ALL') params.set('action', action)
      const data = await get<{ items: AuditRow[]; total: number; totalPages: number }>(
        `/api/audit-logs?${params.toString()}`,
      )
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, search, entityType, action])

  React.useEffect(() => {
    void load()
  }, [load])

  const columns: DataTableColumn<AuditRow>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: 'actorName',
      header: 'Actor',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.actorName}</p>
          <p className="text-xs text-muted-foreground">{label(r.actorRole)}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{r.action}</code>
      ),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (r) => (
        <div className="min-w-0">
          <Badge variant="outline">{label(r.entityType)}</Badge>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{r.entityId}</p>
        </div>
      ),
    },
    {
      key: 'details',
      header: '',
      className: 'text-right',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setDetail(r)}
          aria-label={`View details of ${r.action} by ${r.actorName}`}
        >
          Details
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable trail of every privileged action across the platform."
        actions={
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            <ScrollText className="size-3.5" aria-hidden="true" />
            {total} entries
          </Badge>
        }
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <DataTable<AuditRow>
          columns={columns}
          items={items}
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No audit entries match"
          emptyDescription="Adjust the entity type, action or actor search to widen the results."
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by actor name…"
          toolbar={
            <>
              <Select
                value={entityType}
                onValueChange={(v) => {
                  setEntityType(v)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-40" aria-label="Filter by entity type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All entities</SelectItem>
                  {AUDIT_ENTITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {label(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={action}
                onValueChange={(v) => {
                  setAction(v)
                  setPage(1)
                }}
              >
                <SelectTrigger size="sm" className="w-56" aria-label="Filter by action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto">
                  <SelectItem value="ALL">All actions</SelectItem>
                  {COMMON_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      <code className="text-xs">{a}</code>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
        />
      </motion.div>

      {/* ---- Detail dialog ---- */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{detail?.action}</DialogTitle>
            <DialogDescription>
              {detail ? `${detail.actorName} (${label(detail.actorRole)}) — ${formatDateTime(detail.createdAt)}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Entity type</p>
                <p className="font-medium">{label(detail?.entityType ?? '')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IP address</p>
                <p className="font-mono text-sm">{detail?.ip ?? '—'}</p>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Entity ID</Label>
              <code className="break-all rounded bg-muted px-2 py-1 text-xs">{detail?.entityId ?? '—'}</code>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Details</Label>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs" aria-label="Audit entry details">
                {prettyDetails(detail?.details ?? null)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
