'use client'

// ============================================================
// HR — Job detail.
// Data: GET /api/jobs/:id + GET /api/jobs/:id/applications
// Actions: Edit, Ranking, Publish/Close (PATCH status),
// Delete (only when zero applications — server enforces 409).
// ============================================================

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Archive,
  ArrowLeft,
  Banknote,
  BarChart3,
  Briefcase,
  CalendarDays,
  GraduationCap,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { get, patch, del } from '@/lib/api-client'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreBar } from '@/components/spa/shared/ScoreBar'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonRows } from '@/components/spa/shared/Loading'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatDateTime, formatMoneyINR, formatSalaryRange, label } from '@/components/spa/shared/formatters'
import { useRouter } from '@/lib/router'
import { cn } from '@/lib/utils'

type JobDetail = {
  id: string
  title: string
  description: string
  location: string
  employmentType: string
  experienceMin: number | null
  educationReq: string | null
  requiredSkills: string[]
  preferredSkills: string[]
  salaryMin: number | null
  salaryMax: number | null
  openings: number | null
  status: 'DRAFT' | 'OPEN' | 'CLOSED'
  publishedAt: string | null
  closedAt: string | null
  createdAt: string
  department: { id: string; name: string } | null
  _count: { applications: number }
}

type JobApplicationRow = {
  id: string
  status: string
  matchScore: number | null
  tfidfScore: number | null
  skillScore: number | null
  appliedAt: string
  candidate: { name: string; email: string; phone?: string; experienceYears?: number }
  resume: { id: string; fileName: string; parseStatus: string } | null
  analysis: { finalScore?: number | null } | null
}

function SkillChips({ skills, tone }: { skills: string[]; tone: 'violet' | 'slate' }) {
  if (!skills || skills.length === 0) return <span className="text-sm text-muted-foreground">None listed</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <Badge
          key={s}
          className={tone === 'violet' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}
        >
          {s}
        </Badge>
      ))}
    </div>
  )
}

export function JobDetailPage({ params }: { params: Record<string, string> }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [job, setJob] = React.useState<JobDetail | null>(null)
  const [apps, setApps] = React.useState<JobApplicationRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [j, a] = await Promise.all([
        get<JobDetail>(`/api/jobs/${params.id}`),
        get<{ items: JobApplicationRow[] }>(`/api/jobs/${params.id}/applications?pageSize=50`),
      ])
      setJob(j)
      setApps(a.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the job')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  React.useEffect(() => {
    void load()
  }, [load])

  const changeStatus = async (next: 'OPEN' | 'CLOSED') => {
    if (!job) return
    const okToGo = await confirmDialog({
      title: next === 'OPEN' ? `Publish “${job.title}”?` : `Close “${job.title}”?`,
      description:
        next === 'OPEN'
          ? 'The job becomes visible to candidates immediately.'
          : 'Candidates will no longer be able to apply.',
      confirmText: next === 'OPEN' ? 'Publish' : 'Close job',
      destructive: next === 'CLOSED',
    })
    if (!okToGo) return
    setBusy(true)
    try {
      await patch(`/api/jobs/${job.id}`, { status: next })
      toast.success(`Job ${next === 'OPEN' ? 'published' : 'closed'}.`)
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the job')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!job) return
    const okToGo = await confirmDialog({
      title: `Delete “${job.title}”?`,
      description: 'This permanently removes the job. Only possible while it has zero applications.',
      confirmText: 'Delete job',
      destructive: true,
    })
    if (!okToGo) return
    setBusy(true)
    try {
      await del(`/api/jobs/${job.id}`)
      toast.success('Job deleted.')
      router.navigate('#/hr/jobs')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete the job')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <SkeletonRows rows={3} />
        <div className="h-40 animate-pulse rounded-xl border bg-card" />
        <SkeletonRows rows={5} />
        <span className="sr-only">Loading job</span>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <PageHeader title="Job" />
        <ErrorState title="Could not load this job" message={error ?? 'Not found'} onRetry={() => void load()} />
      </div>
    )
  }

  const meta = [
    { icon: Briefcase, text: label(job.employmentType), aria: 'Employment type' },
    { icon: MapPin, text: job.location, aria: 'Location' },
    { icon: Banknote, text: formatSalaryRange(job.salaryMin, job.salaryMax), aria: 'Salary range' },
    { icon: GraduationCap, text: job.educationReq ?? 'No education requirement', aria: 'Education requirement' },
    { icon: CalendarDays, text: job.experienceMin !== null ? `${job.experienceMin}+ yrs experience` : 'Any experience', aria: 'Experience requirement' },
    { icon: CalendarDays, text: `${job.openings ?? 1} opening${(job.openings ?? 1) === 1 ? '' : 's'}`, aria: 'Openings' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        description={`${job.department?.name ?? 'No department'} • Created ${formatDate(job.createdAt)}${
          job.publishedAt ? ` • Published ${formatDate(job.publishedAt)}` : ''
        }`}
        actions={
          <>
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-9 gap-1.5">
              <a href={`#/hr/jobs/${job.id}/edit`}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </a>
            </Button>
            <Button asChild size="sm" className="min-h-9 gap-1.5">
              <a href={`#/hr/jobs/${job.id}/ranking`}>
                <BarChart3 className="size-4" aria-hidden="true" />
                Candidate Ranking
              </a>
            </Button>
          </>
        }
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-4"
      >
        {/* ---- Status + lifecycle actions ---- */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={job.status} />
              <span className="text-sm text-muted-foreground">
                {job._count.applications} application{job._count.applications === 1 ? '' : 's'} received
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {job.status === 'DRAFT' ? (
                <Button size="sm" className="min-h-9" onClick={() => void changeStatus('OPEN')} disabled={busy}>
                  Publish job
                </Button>
              ) : null}
              {job.status === 'OPEN' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-9 gap-1.5"
                  onClick={() => void changeStatus('CLOSED')}
                  disabled={busy}
                >
                  <Archive className="size-4" aria-hidden="true" />
                  Close job
                </Button>
              ) : null}
              {job._count.applications === 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-9 gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => void remove()}
                  disabled={busy}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* ---- Description + skills ---- */}
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{job.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills</CardTitle>
                <CardDescription>Required skills are weighted 40% in the AI match; the rest is text similarity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Required</p>
                  <SkillChips skills={job.requiredSkills} tone="violet" />
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Preferred</p>
                  <SkillChips skills={job.preferredSkills} tone="slate" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---- Meta cards ---- */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">At a glance</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {meta.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <m.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">{m.text}</span>
                  </li>
                ))}
              </ul>
              {job.closedAt ? (
                <p className="mt-4 text-xs text-muted-foreground">Closed on {formatDate(job.closedAt)}</p>
              ) : null}
              {job.status === 'DRAFT' ? (
                <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs text-[var(--warning)]">
                  This job is a draft — candidates cannot see or apply to it until it is published.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* ---- Applications table ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications</CardTitle>
            <CardDescription>
              Open the AI screening view for any candidate to see evidence, workflow and history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apps.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No applications yet"
                description="Once candidates apply, their AI match scores appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Candidate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-44">AI match</TableHead>
                      <TableHead className="hidden md:table-cell">Resume</TableHead>
                      <TableHead className="hidden md:table-cell">Applied</TableHead>
                      <TableHead className="text-right">Screening</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apps.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <p className="font-medium">{a.candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{a.candidate.email}</p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                        <TableCell>
                          <ScoreBar value={a.matchScore} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span
                            className={cn(
                              'text-xs',
                              a.resume?.parseStatus === 'SUCCESS' ? 'text-muted-foreground' : 'text-[var(--warning)]',
                            )}
                          >
                            {a.resume ? label(a.resume.parseStatus) : 'No resume'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap md:table-cell">
                          <span className="text-sm text-muted-foreground">{formatDateTime(a.appliedAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm" className="h-8" aria-label={`Screen ${a.candidate.name}`}>
                            <a href={`#/hr/applications/${a.id}`}>Open</a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Need a different view? <Link href={`#/hr/jobs/${job.id}/ranking`} className="text-primary hover:underline">Compare all candidates side by side →</Link>
        </p>
      </motion.div>
    </div>
  )
}
