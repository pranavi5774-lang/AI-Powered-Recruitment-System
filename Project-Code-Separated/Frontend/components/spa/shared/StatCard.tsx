'use client'

import type { LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  hint,
  className,
  index = 0,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  /** Small delta chip, e.g. '+12% vs last week' or any node. */
  trend?: React.ReactNode
  hint?: string
  className?: string
  /** Stagger index for entrance animation. */
  index?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: reduce ? 0 : Math.min(index * 0.06, 0.3), ease: 'easeOut' }}
      className={cn(
        'card-hover-lift rounded-xl border bg-card p-4 sm:p-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        {trend}
      </div>
      <div className="mt-4 space-y-1">
        <div className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</div>
        <div className="text-sm text-muted-foreground">{hint ?? label}</div>
      </div>
    </motion.div>
  )
}
