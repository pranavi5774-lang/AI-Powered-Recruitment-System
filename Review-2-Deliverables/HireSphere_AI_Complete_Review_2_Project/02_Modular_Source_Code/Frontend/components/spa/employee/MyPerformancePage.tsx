'use client'

// ============================================================
// My Performance — review history for the logged-in employee.
// Data: GET /api/performance (own, server forces employeeId).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Award, CalendarDays, Quote, Target, TrendingUp, Wrench } from 'lucide-react'
import { get, type Paginated } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDate } from '@/components/spa/shared/formatters'

type Review = {
  id: string
  period: string
  reviewDate: string
  rating: number
  goals: string
  achievements: string
  feedback: string
  strengths: string | null
  areasToImprove: string | null
  reviewerName: string
  employee: { id: string; name: string; employeeCode: string }
}

const RATING_LEGEND: { value: number; label: string; description: string }[] = [
  { value: 1, label: 'Needs improvement', description: 'Performance is below expectations across key areas.' },
  { value: 2, label: 'Developing', description: 'Meets some expectations; clear growth plan needed.' },
  { value: 3, label: 'Meets expectations', description: 'Solid, reliable performance in the role.' },
  { value: 4, label: 'Exceeds expectations', description: 'Consistently above the bar; a go-to contributor.' },
  { value: 5, label: 'Outstanding', description: 'Exceptional impact and role-model behaviour.' },
]

function Stars({ rating, size = 5 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={cn('size-4', i < rating ? 'fill-[var(--warning)] text-[var(--warning)]' : 'fill-muted text-muted-foreground/30')}
          style={{ width: size * 4, height: size * 4 }}
          aria-hidden="true"
        >
          <path d="M12 2l2.9 6.26 6.85.72-5.09 4.63 1.43 6.73L12 16.9l-6.09 3.44 1.43-6.73L2.25 8.98l6.85-.72L12 2z" />
        </svg>
      ))}
    </span>
  )
}

/** strengths/areasToImprove arrive as free text; split on common separators. */
function toChips(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(/[,;\n•|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8)
}

export function MyPerformancePage() {
  const reduce = useReducedMotion()

  const [reviews, setReviews] = useState<Paginated<Review> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<Paginated<Review>>('/api/performance?pageSize=20&sortBy=reviewDate&sortDir=desc')
      setReviews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance reviews')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Performance"
        description="Your review history — goals, achievements and feedback from your reviewers."
      />

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <div className="space-y-4" role="status" aria-live="polite">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
          <span className="sr-only">Loading reviews</span>
        </div>
      ) : !reviews || reviews.items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No performance reviews yet"
          description="Reviews appear here once HR publishes them — typically at the end of each review period."
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Timeline */}
          <ol className="relative space-y-5 border-l border-border pl-6 lg:col-span-2">
            {reviews.items.map((r, i) => (
              <motion.li
                key={r.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.35, delay: reduce ? 0 : Math.min(i * 0.06, 0.24), ease: 'easeOut' }}
                className="relative"
              >
                <span
                  className="absolute -left-[31px] top-5 flex size-3.5 items-center justify-center rounded-full border-2 border-background bg-primary"
                  aria-hidden="true"
                />
                <Card className="card-hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{r.period}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          Reviewed {formatDate(r.reviewDate)} · by {r.reviewerName}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stars rating={r.rating} />
                        <Badge variant="secondary" className="tabular-nums">
                          {r.rating}/5
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3.5">
                    <Section icon={Target} title="Goals">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{r.goals}</p>
                    </Section>
                    <Section icon={Award} title="Achievements">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{r.achievements}</p>
                    </Section>
                    <Section icon={Quote} title="Feedback">
                      <blockquote className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
                        “{r.feedback}”
                      </blockquote>
                    </Section>
                    {toChips(r.strengths).length > 0 ? (
                      <Section icon={TrendingUp} title="Strengths">
                        <div className="flex flex-wrap gap-1.5">
                          {toChips(r.strengths).map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="border-[var(--success)]/40 bg-[color-mix(in_oklch,var(--success)_12%,transparent)] font-normal text-[var(--success)]"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </Section>
                    ) : null}
                    {toChips(r.areasToImprove).length > 0 ? (
                      <Section icon={Wrench} title="Areas to improve">
                        <div className="flex flex-wrap gap-1.5">
                          {toChips(r.areasToImprove).map((s) => (
                            <Badge variant="outline" key={s} className="font-normal text-muted-foreground">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </Section>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </ol>

          {/* Rating legend */}
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-base">Rating scale</CardTitle>
              <CardDescription>How to read the 1–5 stars on each review.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {RATING_LEGEND.map((item) => (
                  <li key={item.value} className="flex items-start gap-3">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--warning)]/40 bg-[color-mix(in_oklch,var(--warning)_12%,transparent)] text-xs font-semibold tabular-nums text-[var(--warning)]"
                      aria-hidden="true"
                    >
                      {item.value}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {title}
      </p>
      {children}
    </div>
  )
}
