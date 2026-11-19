'use client'

// ============================================================
// StubView — placeholder frame for modules that later agents
// replace with real implementations. Professional, icon-led,
// consistent across every route.
// ============================================================

import type { LucideIcon } from 'lucide-react'
import { Hammer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from './PageHeader'

export function StubView({
  title,
  description,
  icon: Icon,
  moduleName,
}: {
  title: string
  description?: string
  icon: LucideIcon
  moduleName: string
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-10 text-center sm:p-14">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" aria-hidden="true" />
            <div className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
              <Icon className="size-8 text-primary" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="flex items-center justify-center gap-2 font-semibold">
              <Hammer className="size-4 text-muted-foreground" aria-hidden="true" />
              {moduleName} — under construction
            </p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              This module is being wired to the API next. Data, actions and charts for{' '}
              <span className="font-medium text-foreground">{moduleName}</span> will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
