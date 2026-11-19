'use client'

import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2 min-h-9">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15">
        <span className="text-xl" aria-hidden="true">
          ⚠
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {message ? <p className="max-w-md text-sm text-muted-foreground">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="min-h-9">
          Try again
        </Button>
      ) : null}
    </div>
  )
}
