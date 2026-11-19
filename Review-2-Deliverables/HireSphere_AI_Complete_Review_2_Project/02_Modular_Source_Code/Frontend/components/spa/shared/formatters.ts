import { format, formatDistanceToNow, isValid } from 'date-fns'

// ============================================================
// HireSphere AI — display formatters (shared)
// ============================================================

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return isValid(d) ? d : null
}

/** 'dd MMM yyyy' — safe on null/undefined. */
export function formatDate(value: Date | string | number | null | undefined, fallback = '—'): string {
  const d = toDate(value)
  return d ? format(d, 'dd MMM yyyy') : fallback
}

/** 'dd MMM yyyy, HH:mm' — safe on null/undefined. */
export function formatDateTime(value: Date | string | number | null | undefined, fallback = '—'): string {
  const d = toDate(value)
  return d ? format(d, 'dd MMM yyyy, HH:mm') : fallback
}

/** 'dd MMM, HH:mm' — compact variant for tables. */
export function formatShortDateTime(value: Date | string | number | null | undefined, fallback = '—'): string {
  const d = toDate(value)
  return d ? format(d, 'dd MMM, HH:mm') : fallback
}

/** Relative time like '3 hours ago'. */
export function formatRelativeTime(value: Date | string | number | null | undefined, fallback = '—'): string {
  const d = toDate(value)
  return d ? formatDistanceToNow(d, { addSuffix: true }) : fallback
}

/** Money in INR, e.g. ₹12,50,000. */
export function formatMoneyINR(value: number | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Salary range like '₹8,00,000 – ₹12,00,000'. */
export function formatSalaryRange(min?: number | null, max?: number | null): string {
  if (min && max) return `${formatMoneyINR(min)} – ${formatMoneyINR(max)}`
  if (min) return `${formatMoneyINR(min)}+`
  if (max) return `up to ${formatMoneyINR(max)}`
  return '—'
}

/**
 * Percent from a score. Accepts 0..1 fractions (AI scores) or 0..100 values.
 */
export function formatPercent(value: number | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback
  const pct = value <= 1 ? value * 100 : value
  return `${Math.round(pct)}%`
}

/** Decimal score 0..1 with two digits, e.g. 0.72. */
export function formatScore(value: number | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback
  return (value <= 1 ? value : value / 100).toFixed(2)
}

/** Humanize SCREAMING_SNAKE_CASE via the LABELS map with a fallback. */
export function label(value: string | null | undefined): string {
  if (!value) return '—'
  const overrides: Record<string, string> = {
    FULL_TIME: 'Full Time',
    PART_TIME: 'Part Time',
    HALF_DAY: 'Half Day',
    WFH: 'Work From Home',
    UNDER_REVIEW: 'Under Review',
    ON_PROBATION: 'On Probation',
    ON_LEAVE: 'On Leave',
  }
  return (
    overrides[value] ??
    value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

/** Initials for avatars: 'Aarav Sharma' -> 'AS'. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
