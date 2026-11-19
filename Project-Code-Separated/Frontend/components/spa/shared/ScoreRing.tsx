'use client'

import { cn } from '@/lib/utils'

function scoreColor(pct: number): string {
  if (pct >= 75) return 'var(--success)'
  if (pct >= 50) return 'var(--chart-1)'
  if (pct >= 30) return 'var(--warning)'
  return 'var(--destructive)'
}

/**
 * SVG donut ring for match scores (0..1 or 0..100).
 */
export function ScoreRing({
  value,
  size = 72,
  strokeWidth = 7,
  label,
  className,
}: {
  value: number | null | undefined
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <div
        className={cn('flex items-center justify-center text-xs text-muted-foreground', className)}
        style={{ width: size, height: size }}
      >
        N/A
      </div>
    )
  }
  const pct = Math.max(0, Math.min(100, value <= 1 ? value * 100 : value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct / 100)
  const color = scoreColor(pct)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label ?? 'Match score'}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>
          {Math.round(pct)}%
        </span>
        {label ? <span className="text-[10px] text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  )
}
