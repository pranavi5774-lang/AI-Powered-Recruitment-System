'use client'

// ============================================================
// Admin — System Settings (ADMIN only endpoints).
// Data: GET /api/settings → { items: [{key, value, updatedAt}] }
// Save: PATCH /api/settings with { key, value } per setting.
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Building2, Clock, Save, Settings as SettingsIcon, Timer } from 'lucide-react'
import { toast } from 'sonner'

import { get, patch } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonCards } from '@/components/spa/shared/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDateTime } from '@/components/spa/shared/formatters'

type SettingRow = { id: string; key: string; value: string; updatedAt: string }

type SettingsForm = {
  org_name: string
  work_start: string
  work_end: string
  late_after_minutes: string
}

const DEFAULTS: SettingsForm = {
  org_name: '',
  work_start: '09:00',
  work_end: '18:00',
  late_after_minutes: '15',
}

const FIELDS: {
  key: keyof SettingsForm
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  type?: string
  min?: number
  max?: number
}[] = [
  {
    key: 'org_name',
    label: 'Organization name',
    hint: 'Shown across the workspace and exports.',
    icon: Building2,
  },
  {
    key: 'work_start',
    label: 'Work hours start',
    hint: 'Expected check-in time (HH:mm).',
    icon: Clock,
    type: 'time',
  },
  {
    key: 'work_end',
    label: 'Work hours end',
    hint: 'Expected check-out time (HH:mm).',
    icon: Clock,
    type: 'time',
  },
  {
    key: 'late_after_minutes',
    label: 'Late grace period (minutes)',
    hint: 'Check-ins after start + grace are marked Late.',
    icon: Timer,
    type: 'number',
    min: 0,
    max: 240,
  },
]

export function SettingsPage(_props: unknown) {
  const [rows, setRows] = React.useState<SettingRow[]>([])
  const [form, setForm] = React.useState<SettingsForm>(DEFAULTS)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const reduce = useReducedMotion()

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<{ items: SettingRow[] }>('/api/settings')
      setRows(data.items)
      const next = { ...DEFAULTS }
      for (const row of data.items) {
        if (row.key in next) next[row.key as keyof SettingsForm] = row.value
      }
      setForm(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const updatedAtFor = (key: string): string | null => {
    const row = rows.find((r) => r.key === key)
    return row ? row.updatedAt : null
  }

  const save = async () => {
    setSaving(true)
    try {
      const changed = FIELDS.filter((f) => {
        const row = rows.find((r) => r.key === f.key)
        return !row || row.value !== form[f.key]
      })
      if (changed.length === 0) {
        toast.info('Nothing to save — settings are unchanged.')
        return
      }
      for (const f of changed) {
        await patch('/api/settings', { key: f.key, value: form[f.key] })
      }
      toast.success(`Saved ${changed.length} setting${changed.length === 1 ? '' : 's'}.`)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organization profile and working-time policy used by attendance rules."
        actions={
          <Button size="sm" className="min-h-9 gap-1.5" onClick={() => void save()} disabled={saving || loading}>
            <Save className="size-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      {error ? (
        <ErrorState title="Could not load settings" message={error} onRetry={() => void load()} />
      ) : loading ? (
        <SkeletonCards count={2} />
      ) : (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SettingsIcon className="size-4 text-primary" aria-hidden="true" />
                General configuration
              </CardTitle>
              <CardDescription>
                Changes apply immediately and are recorded in the audit trail (SETTING_UPDATED).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {FIELDS.map((f) => {
                const Icon = f.icon
                const updated = updatedAtFor(f.key)
                return (
                  <div key={f.key} className="grid gap-2">
                    <Label htmlFor={`set-${f.key}`} className="flex items-center gap-1.5">
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {f.label}
                    </Label>
                    <Input
                      id={`set-${f.key}`}
                      type={f.type ?? 'text'}
                      value={form[f.key]}
                      min={f.min}
                      max={f.max}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="max-w-56"
                    />
                    <p className="text-xs text-muted-foreground">{f.hint}</p>
                    {updated ? (
                      <p className="text-[11px] text-muted-foreground/70">Last updated {formatDateTime(updated)}</p>
                    ) : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
