'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      aria-label="Loading"
      role="status"
      className={cn('size-5 animate-spin text-primary', className)}
    />
  )
}

/** Full-area centered spinner. */
export function SpinnerCentered({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}>
      <Spinner className="size-7" />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  )
}
