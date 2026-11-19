'use client'

// ============================================================
// Candidate Dashboard — welcome, profile completeness, stats,
// latest status change + quick actions.
// Data: GET /api/dashboard/candidate (+ /api/auth/me,
// /api/resumes/mine for the resume checklist item).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronRight,
  Circle,
  ClipboardList,
  Flame,
  Sparkles,
  Upload,
  UserRound,
} from 'lucide-react'
import { get } from '@/lib/api-client'
import { useRouter } from '@/lib/router'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatCard } from '@/components/spa/shared/StatCard'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreRing } from '@/components/spa/shared/ScoreRing'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonCards, SkeletonRows } from '@/components/spa/shared/Loading'
import { formatRelativeTime, label } from '@/components/spa/shared/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CandidateDashboardData = {
  activeJobs: number
  myApplications: number
  myShortlisted: number
  profileCompleteness: number
  recentStatus: {
    applicationId: string
    jobTitle: string
    toStatus: string
    statusLabel: string
    actorRole?: string
    actorName?: string
    note?: string | null
    createdAt: string
  } | null
}

type ChecklistItem = {
  key: string
  text: string
  done: boolean
  href: string
}

export function CandidateDashboard() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const reduce = useReducedMotion()

  const [data, setData] = useState<CandidateDashboardData | null>(null)
  const [profile, setProfile] = useState<{
    phone: string | null
    headline: string | null
    education: string | null
    summary: string | null
  } | null>(null)
  const [hasResume, setHasResume] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dash, me, resumes] = await Promise.all([
        get<CandidateDashboardData>('/api/dashboard/candidate'),
        get<{ user: { candidateProfile?: { phone: string | null; headline: string | null; education: string | null; summary: string | null } | null } }>(
          '/api/auth/me',
        ),
        get<{ total: number }>('/api/resumes/mine?pageSize=1'),
      ])
      setData(dash)
      setProfile(me.user.candidateProfile ?? null)
      setHasResume(resumes.total > 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const firstName = (user?.name ?? '').split(/\s+/)[0] || 'there'

  const checklist: ChecklistItem[] = [
    { key: 'resume', text: 'Upload your resume (PDF)', done: hasResume === true, href: '#/portal/profile' },
    { key: 'phone', text: 'Add a phone number', done: Boolean(profile?.phone), href: '#/portal/profile' },
    { key: 'headline', text: 'Write a professional headline', done: Boolean(profile?.headline), href: '#/portal/profile' },
    { key: 'education', text: 'Add your education', done: Boolean(profile?.education), href: '#/portal/profile' },
    { key: 'summary', text: 'Summarise your experience', done: Boolean(profile?.summary), href: '#/portal/profile' },
  ]
  const doneCount = checklist.filter((c) => c.done).length

  return (
    <div className="space-y-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-6 text-primary" aria-hidden="true" />
              Welcome back, {firstName}
            </span>
          }
          description="Track your applications, strengthen your profile and discover new AI-matched roles."
          actions={
            <>
              <Button
                onClick={() => router.navigate('#/portal/jobs')}
                className="min-h-11 gap-2"
                aria-label="Browse open jobs"
              >
                <Briefcase className="size-4" aria-hidden="true" />
                Browse Jobs
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.navigate('#/portal/profile')}
                className="min-h-11 gap-2"
                aria-label="Upload resume in profile"
              >
                <Upload className="size-4" aria-hidden="true" />
                Upload Resume
              </Button>
            </>
          }
        />
      </motion.div>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading || !data ? (
        <LoadingState />
      ) : (
        <>
          {/* Recent status change alert */}
          {data.recentStatus ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              role="status"
            >
              <button
                type="button"
                onClick={() => router.navigate('#/portal/applications')}
                className="flex w-full flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 sm:flex-row sm:items-center sm:gap-4"
                aria-label={`Latest update: ${data.recentStatus.jobTitle} is now ${label(data.recentStatus.toStatus)}. Open my applications`}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Flame className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Latest update — <span className="text-foreground">{data.recentStatus.jobTitle}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(data.recentStatus.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={data.recentStatus.toStatus} />
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </div>
              </button>
            </motion.div>
          ) : null}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Briefcase}
              label="Open positions"
              value={data.activeJobs}
              hint="Active jobs right now"
              index={0}
            />
            <StatCard
              icon={ClipboardList}
              label="My applications"
              value={data.myApplications}
              hint="Applications submitted"
              index={1}
            />
            <StatCard
              icon={Check}
              label="Shortlisted"
              value={data.myShortlisted}
              hint="Times shortlisted"
              index={2}
            />
            <StatCard
              icon={UserRound}
              label="Profile strength"
              value={`${data.profileCompleteness}%`}
              hint={`${doneCount}/${checklist.length} profile steps done`}
              index={3}
            />
          </div>

          {/* Completeness + latest application */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="card-hover-lift">
              <CardHeader>
                <CardTitle className="text-base">Profile completeness</CardTitle>
                <CardDescription>A complete profile ranks higher in AI screening.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-1">
                  <ScoreRing value={data.profileCompleteness} size={96} strokeWidth={9} label="complete" />
                </div>
                <ul className="w-full space-y-1.5" aria-label="Profile checklist">
                  {checklist.map((item) => (
                    <li key={item.key}>
                      <a
                        href={item.href}
                        className={cn(
                          'flex min-h-9 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                          item.done ? 'text-muted-foreground' : 'font-medium',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded-full border',
                            item.done
                              ? 'border-transparent bg-[var(--success)] text-white'
                              : 'border-dashed border-muted-foreground/50 text-transparent',
                          )}
                          aria-hidden="true"
                        >
                          <Check className="size-3" />
                        </span>
                        <span className={item.done ? 'line-through decoration-border' : ''}>{item.text}</span>
                        {!item.done ? (
                          <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="card-hover-lift">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1.5">
                  <CardTitle className="text-base">Application status</CardTitle>
                  <CardDescription>Your most recent pipeline movement.</CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => router.navigate('#/portal/applications')}
                  className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  View all
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </CardHeader>
              <CardContent>
                {data.recentStatus ? (
                  <ol className="relative space-y-4 border-l border-border pl-5" aria-label="Recent status timeline">
                    <li
                      className="group relative -ml-3 cursor-pointer rounded-lg p-3 transition-colors hover:bg-accent/40"
                      onClick={() => router.navigate('#/portal/applications')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.navigate('#/portal/applications')
                        }
                      }}
                    >
                      <span
                        className="absolute -left-[14.5px] top-4 flex size-4 items-center justify-center rounded-full bg-primary"
                        aria-hidden="true"
                      >
                        <Circle className="size-1.5 fill-background text-background" />
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={data.recentStatus.toStatus} />
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(data.recentStatus.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium group-hover:text-primary transition-colors">
                        {data.recentStatus.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.recentStatus.toStatus === 'WITHDRAWN'
                          ? 'Withdrawn by you. You can re-apply while the role remains open.'
                          : data.recentStatus.toStatus === 'APPLIED'
                          ? 'Application submitted. Awaiting review.'
                          : data.recentStatus.toStatus === 'UNDER_REVIEW'
                          ? 'Under review by the hiring team.'
                          : data.recentStatus.toStatus === 'SHORTLISTED'
                          ? 'Profile shortlisted by the hiring team.'
                          : data.recentStatus.toStatus === 'INTERVIEW'
                          ? 'Interview round scheduled.'
                          : data.recentStatus.toStatus === 'SELECTED'
                          ? 'Selected for the role.'
                          : data.recentStatus.toStatus === 'HIRED'
                          ? 'Offer accepted — congratulations!'
                          : data.recentStatus.toStatus === 'REJECTED'
                          ? 'Application reviewed by the hiring team.'
                          : `Status set to ${label(data.recentStatus.toStatus)}.`}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">
                          {data.recentStatus.toStatus === 'WITHDRAWN' ? 'Re-apply or view application' : 'View application details'}
                          <ChevronRight className="size-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </li>
                  </ol>
                ) : (
                  <EmptyState
                    icon={ClipboardList}
                    title="No applications yet"
                    description="Browse open roles and apply with your resume — AI screening scores you instantly."
                    className="py-8"
                    action={
                      <Button size="sm" className="min-h-11" onClick={() => router.navigate('#/portal/jobs')}>
                        Browse Jobs
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <SkeletonCards count={4} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <SkeletonRows rows={5} />
        </div>
        <div className="rounded-xl border bg-card p-6">
          <SkeletonRows rows={3} />
        </div>
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  )
}
