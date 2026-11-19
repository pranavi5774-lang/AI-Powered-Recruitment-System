'use client'

// ============================================================
// Admin — Organization Reports (also reused by HR Reports page).
// Data: GET /api/reports/[type]?from=&to=&month=&format=json|csv
// The API returns a generic tabular shape:
//   { type, generatedAt, count, columns: [{key,label}], items: [...] }
// so the table rendering below is fully data-driven.
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalendarRange, Download, Printer, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/spa/shared/PageHeader'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonRows } from '@/components/spa/shared/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatDateTime, formatPercent, label } from '@/components/spa/shared/formatters'
import { cn } from '@/lib/utils'

export type ReportColumn = { key: string; label: string }
export type ReportEnvelope = {
  type: string
  generatedAt: string
  count: number
  columns: ReportColumn[]
  items: Record<string, unknown>[]
}

export const REPORT_TYPES = [
  { key: 'recruitment', label: 'Recruitment' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'employees', label: 'Employees' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leaves', label: 'Leaves' },
  { key: 'performance', label: 'Performance' },
  { key: 'screening', label: 'AI Screening' },
] as const

export type ReportTypeKey = (typeof REPORT_TYPES)[number]['key']

/** Format any generic cell value from a report row. */
function renderCell(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>
  if (/score/i.test(key)) return <span className="tabular-nums">{formatPercent(Number(value))}</span>
  if (/date$|_at$|^at$/i.test(key) || /date/i.test(key)) {
    const d = new Date(String(value))
    if (!Number.isNaN(d.getTime())) return <span className="whitespace-nowrap text-muted-foreground">{formatDate(d)}</span>
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  const asNum = Number(value)
  if (!Number.isNaN(asNum) && String(value).trim() !== '' && /^\d+(\.\d+)?$/.test(String(value))) {
    return <span className="tabular-nums">{value as string | number}</span>
  }
  // status-ish columns get humanized labels
  if (/status/i.test(key) && typeof value === 'string') return label(value)
  return String(value)
}

async function downloadCsv(type: string, query: URLSearchParams) {
  const q = new URLSearchParams(query)
  q.set('format', 'csv')
  const res = await fetch(`/api/reports/${type}?${q.toString()}`, { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`Export failed with status ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hiresphere-${type}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Shared generic report view — used by both Admin (org reports) and HR reports.
 */
export function ReportsView({ title, description }: { title: string; description: string }) {
  const [type, setType] = React.useState<ReportTypeKey>('recruitment')
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')
  const [month, setMonth] = React.useState(() => new Date().toISOString().slice(0, 7))
  const [report, setReport] = React.useState<ReportEnvelope | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [exporting, setExporting] = React.useState(false)
  const reduce = useReducedMotion()

  const query = React.useMemo(() => {
    const q = new URLSearchParams()
    if (type === 'attendance') {
      if (month) q.set('month', month)
    } else {
      if (from) q.set('from', from)
      if (to) q.set('to', to)
    }
    return q
  }, [type, from, to, month])

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${type}?${query.toString()}`, { credentials: 'same-origin' })
      const json = (await res.json()) as { ok: boolean; data?: ReportEnvelope; error?: { message: string } }
      if (!res.ok || !json.ok || !json.data) throw new Error(json.error?.message ?? `Report failed (${res.status})`)
      setReport(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [type, query])

  React.useEffect(() => {
    void load()
  }, [load])

  const onExport = async () => {
    setExporting(true)
    try {
      await downloadCsv(type, query)
      toast.success('CSV exported — check your downloads.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'CSV export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      {/* Controls (hidden in print) */}
      <div className={cn('space-y-4', 'print:hidden')}>
        <Tabs value={type} onValueChange={(v) => setType(v as ReportTypeKey)}>
          <TabsList className="h-auto flex-wrap justify-start gap-1">
            {REPORT_TYPES.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="min-h-9">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-hidden="true">
            <CalendarRange className="size-4" />
          </div>
          {type === 'attendance' ? (
            <div className="grid gap-1.5">
              <Label htmlFor="rep-month" className="text-xs">
                Month
              </Label>
              <Input
                id="rep-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-44"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="rep-from" className="text-xs">
                  From
                </Label>
                <Input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rep-to" className="text-xs">
                  To
                </Label>
                <Input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
              </div>
            </>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-9 gap-1.5"
              onClick={() => void onExport()}
              disabled={exporting || loading}
            >
              <Download className="size-4" aria-hidden="true" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden="true" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Print-only heading */}
      <div className="hidden print:block">
        <h1 className="text-xl font-semibold">
          HireSphere — {REPORT_TYPES.find((t) => t.key === type)?.label} report
        </h1>
        <p className="text-sm">
          {type === 'attendance' ? `Month ${month}` : `${from || 'beginning'} → ${to || 'today'}`}
        </p>
      </div>

      {/* Report table */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:hidden">
            <CardTitle className="text-base">{REPORT_TYPES.find((t) => t.key === type)?.label} report</CardTitle>
            {report && (
              <CardDescription>
                {report.count} row{report.count === 1 ? '' : 's'} • generated {formatDateTime(report.generatedAt)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <ErrorState title="Could not load this report" message={error} onRetry={() => void load()} />
            ) : loading ? (
              <SkeletonRows rows={7} />
            ) : !report || report.items.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No rows for the selected range. Try widening the date filter.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {report.columns.map((c) => (
                        <TableHead key={c.key} className="whitespace-nowrap">
                          {c.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.items.map((row, i) => (
                      <TableRow key={i}>
                        {report.columns.map((c) => (
                          <TableCell key={c.key} className="max-w-64 truncate whitespace-nowrap">
                            {renderCell(c.key, row[c.key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export function OrgReportsPage(_props: unknown) {
  return (
    <ReportsView
      title="Organization Reports"
      description="Org-wide recruitment, workforce and AI-screening exports. Filter by date, then export as CSV or print."
    />
  )
}
