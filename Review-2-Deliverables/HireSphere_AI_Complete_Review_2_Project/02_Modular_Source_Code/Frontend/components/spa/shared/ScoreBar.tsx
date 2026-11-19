'use client'

import { cn } from '@/lib/utils'

function scoreColor(pct: number): string {
  if (pct >= 75) return 'var(--success)'
  if (pct >= 50) return 'var(--chart-1)'
  if (pct >= 30) return 'var(--warning)'
  return 'var(--destructive)'
}

/**
 * Horizontal 0-100 score bar with gradient fill.
 * `value` accepts 0..1 fractions or 0..100 numbers.
 */
export function ScoreBar({
  value,
  label,
  showValue = true,
  className,
}: {
  value: number | null | undefined
  label?: string
  showValue?: boolean
  className?: string
}) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className={cn('text-sm text-muted-foreground', className)}>No score</span>
  }
  const pct = Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
  return (
    <div className={cn('w-full space-y-1', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label ? <span className="text-muted-foreground">{label}</span> : <span />}
          {showValue ? (
            <span className="font-medium tabular-nums" style={{ color: scoreColor(pct) }}>
              {Math.round(pct)}%
            </span>
          ) : null}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={label ?? 'Score'}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, oklch(0.58 0.2 293) 0%, ${
              pct >= 50 ? 'var(--info)' : 'var(--warning)'
            } 100%)`,
          }}
        />
      </div>
    </div>
  )
}
