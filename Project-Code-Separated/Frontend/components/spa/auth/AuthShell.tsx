'use client'

// ============================================================
// AuthShell — shared backdrop + glass card frame for auth views.
// ============================================================

import * as React from 'react'
import { Sparkles } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/4 size-96 animate-pulse rounded-full bg-primary/25 blur-3xl" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-0 right-1/5 size-80 animate-pulse rounded-full bg-[var(--info)]/15 blur-3xl" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 left-0 size-72 animate-pulse rounded-full bg-[var(--chart-3)]/10 blur-3xl" style={{ animationDuration: '7s' }} />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.3) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 25%, transparent 78%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <a href="#/" className="mb-8 flex items-center justify-center gap-2.5" aria-label="HireSphere AI home">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.23_293)] to-[oklch(0.72_0.13_210)] shadow-lg shadow-primary/25">
            <Sparkles className="size-5.5 text-white" aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            HireSphere <span className="text-gradient">AI</span>
          </span>
        </a>

        <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </main>
  )
}
