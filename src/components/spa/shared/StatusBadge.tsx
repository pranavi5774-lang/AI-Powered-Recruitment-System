'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================
// StatusBadge — consistent status colors across the whole app.
// Palette contract (do not introduce new ad-hoc colors):
//   green  = HIRED / APPROVED / PRESENT / ACTIVE / SUCCESS / OPEN
//   amber  = PENDING / UNDER_REVIEW / LATE / HALF_DAY / ON_PROBATION
//   violet = INTERVIEW / SCHEDULED   (violet instead of default blue)
//   red    = REJECTED / ABSENT / TERMINATED / FAILED
//   slate  = WITHDRAWN / CLOSED / CANCELLED / DRAFT
//   cyan   = SHORTLISTED
//   violet-strong = SELECTED
// ============================================================

type Tone = 'green' | 'amber' | 'violet' | 'violetStrong' | 'red' | 'slate' | 'cyan' | 'neutral'

const STATUS_TONES: Record<string, Tone> = {
  // recruitment pipeline
  APPLIED: 'neutral',
  UNDER_REVIEW: 'amber',
  SHORTLISTED: 'cyan',
  INTERVIEW: 'violet',
  SELECTED: 'violetStrong',
  HIRED: 'green',
  REJECTED: 'red',
  WITHDRAWN: 'slate',
  // jobs
  OPEN: 'green',
  DRAFT: 'slate',
  CLOSED: 'slate',
  // generic
  ACTIVE: 'green',
  SUCCESS: 'green',
  APPROVED: 'green',
  PENDING: 'amber',
  SCHEDULED: 'violet',
  COMPLETED: 'green',
  CANCELLED: 'slate',
  FAILED: 'red',
  SUSPENDED: 'red',
  // attendance
  PRESENT: 'green',
  ABSENT: 'red',
  LATE: 'amber',
  HALF_DAY: 'amber',
  LEAVE: 'cyan',
  WFH: 'cyan',
  HOLIDAY: 'slate',
  // employee lifecycle
  ON_PROBATION: 'amber',
  ON_LEAVE: 'cyan',
  RESIGNED: 'slate',
  TERMINATED: 'red',
  // resumes
  PENDING_PARSE: 'amber',
}

const TONE_CLASSES: Record<Tone, string> = {
  green: 'border-transparent bg-[color-mix(in_oklch,var(--success)_18%,transparent)] text-[var(--success)] [a&]:hover:opacity-90',
  amber: 'border-transparent bg-[color-mix(in_oklch,var(--warning)_18%,transparent)] text-[var(--warning)] [a&]:hover:opacity-90',
  violet:
    'border-transparent bg-[color-mix(in_oklch,var(--primary)_18%,transparent)] text-[oklch(0.75_0.15_293)] [a&]:hover:opacity-90',
  violetStrong:
    'border-transparent bg-[color-mix(in_oklch,var(--primary)_30%,transparent)] text-[oklch(0.85_0.12_293)] ring-1 ring-inset ring-[color-mix(in_oklch,var(--primary)_50%,transparent)] [a&]:hover:opacity-90',
  red: 'border-transparent bg-[color-mix(in_oklch,var(--destructive)_18%,transparent)] text-[var(--destructive)] [a&]:hover:opacity-90',
  slate: 'border-transparent bg-muted text-muted-foreground [a&]:hover:opacity-90',
  cyan: 'border-transparent bg-[color-mix(in_oklch,var(--info)_18%,transparent)] text-[var(--info)] [a&]:hover:opacity-90',
  neutral: 'border-border bg-secondary text-secondary-foreground',
}

/** Direct tone lookup if a caller wants to match custom chips to the palette. */
export function toneForStatus(status: string): Tone {
  return STATUS_TONES[status] ?? 'neutral'
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string
  /** Optional display label override (defaults to humanized status). */
  label?: string
  className?: string
}) {
  const tone = toneForStatus(status)
  const text =
    label ??
    status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <Badge className={cn(TONE_CLASSES[tone], className)} title={status}>
      {text}
    </Badge>
  )
}
