'use client'

// ============================================================
// Public Job Detail — full job description + sticky apply panel.
// Data: GET /api/jobs/:id, GET /api/applications?jobId= (applied
// check), GET /api/resumes/mine (resume selector), POST
// /api/applications (apply).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  MapPin,
  ShieldAlert,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react'
import { get, post, ApiError, type Paginated } from '@/lib/api-client'
import { useRouter } from '@/lib/router'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreRing } from '@/components/spa/shared/ScoreRing'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/spa/shared/Spinner'
import {
  formatDate,
  formatRelativeTime,
  formatSalaryRange,
  label as formatLabel,
} from '@/components/spa/shared/formatters'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
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
  status: string
  publishedAt: string | null
  createdAt: string
  department: { id: string; name: string } | null
  creator?: { name: string } | null
  _count: { applications: number }
}

type ResumeMeta = {
  id: string
  fileName: string
  fileSize: number
  parseStatus: string
  isActive: boolean
  uploadedAt: string
}

type ApplyResponse = {
  id: string
  status: string
  matchScore: number | null
  analysis: { finalScore: number; summary: string | null } | null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PublicJobDetailPage({ params }: { params: Record<string, string> }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const jobId = params.id

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [resumes, setResumes] = useState<ResumeMeta[]>([])
  const [resumesLoading, setResumesLoading] = useState(true)
  const [selectedResumeId, setSelectedResumeId] = useState<string>('')
  const [applying, setApplying] = useState(false)
  const [success, setSuccess] = useState<ApplyResponse | null>(null)
  const [myApplication, setMyApplication] = useState<{ id: string; status: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const data = await get<JobDetail>(`/api/jobs/${jobId}`)
      setJob(data)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true)
      else setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    void load()
  }, [load])

  // Applied check + resume list
  const loadApplyState = useCallback(async () => {
    setResumesLoading(true)
    try {
      const [apps, mine] = await Promise.all([
        get<Paginated<{ id: string; status: string }>>(`/api/applications?jobId=${jobId}&pageSize=5`).catch(() => null),
        get<Paginated<ResumeMeta>>('/api/resumes/mine?pageSize=50'),
      ])
      setResumes(mine.items)
      const latest = apps?.items[0] ?? null
      setMyApplication(latest)
      const active = mine.items.find((r) => r.isActive) ?? mine.items[0]
      if (active) setSelectedResumeId((cur) => cur || active.id)
    } catch {
      // resume list failures degrade to the no-resume prompt
    } finally {
      setResumesLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    void loadApplyState()
  }, [loadApplyState])

  const handleApply = async () => {
    const authStatus = useAuthStore.getState().status
    if (authStatus !== 'authed') {
      router.navigate(`#/login?next=${encodeURIComponent(`#/portal/jobs/${jobId}`)}`)
      return
    }
    if (!selectedResumeId) {
      toast.error('Select a resume first, or upload one in My Profile.')
      return
    }
    setApplying(true)
    try {
      const data = await post<ApplyResponse>('/api/applications', { jobId, resumeId: selectedResumeId })
      setSuccess(data)
      setMyApplication({ id: data.id, status: data.status })
      toast.success('Application submitted — AI screening complete.')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_APPLICATION') {
        toast.error('You already have an active application for this job.', {
          description: 'Open My Applications to track its status.',
          action: { label: 'My Applications', onClick: () => router.navigate('#/portal/applications') },
        })
        await loadApplyState()
      } else if (err instanceof ApiError && err.code === 'NO_RESUME') {
        toast.error('Upload a resume first, then apply.', {
          action: { label: 'Go to Profile', onClick: () => router.navigate('#/portal/profile') },
        })
      } else if (err instanceof ApiError && err.code === 'JOB_CLOSED') {
        toast.error('This job is no longer accepting applications.')
        await load()
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to submit application')
      }
    } finally {
      setApplying(false)
    }
  }

  if (notFound) {
    return (
      <EmptyState
        title="Job not found"
        description="This job may have been closed or removed."
        action={
          <Button className="min-h-11" onClick={() => router.navigate('#/portal/jobs')}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Browse Jobs
          </Button>
        }
        className="mt-10"
      />
    )
  }

  if (loading || !job) {
    return error ? (
      <ErrorState message={error} onRetry={() => void load()} />
    ) : (
      <div className="space-y-6" role="status" aria-live="polite">
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-1/3" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
        <span className="sr-only">Loading job details</span>
      </div>
    )
  }

  const hasApplied = Boolean(myApplication && myApplication.status !== 'WITHDRAWN')

  return (
    <div className="space-y-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 min-h-9 gap-1.5 text-muted-foreground"
          onClick={() => router.navigate('#/portal/jobs')}
          aria-label="Back to job list"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Browse Jobs
        </Button>
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{job.title}</h1>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {job.department ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" aria-hidden="true" />
                {job.department.name}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              {job.publishedAt ? `Published ${formatRelativeTime(job.publishedAt)}` : formatRelativeTime(job.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="size-4" aria-hidden="true" />
              {formatSalaryRange(job.salaryMin, job.salaryMax)}
              {job.salaryMin ? <span className="text-xs">/ year</span> : null}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Meta cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetaTile icon={Briefcase} title={formatLabel(job.employmentType)} caption="Employment type" />
            <MetaTile
              icon={GraduationCap}
              title={job.experienceMin ? `${job.experienceMin}+ years` : 'Entry level'}
              caption="Experience"
            />
            <MetaTile icon={Users} title={String(job.openings ?? '—')} caption="Openings" />
            <MetaTile icon={Building2} title={job.department?.name ?? '—'} caption="Department" />
            <MetaTile icon={MapPin} title={job.location} caption="Location" />
            <MetaTile icon={BadgeCheck} title={job.educationReq ?? 'Any degree'} caption="Education" />
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{job.description}</p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills</CardTitle>
              <CardDescription>The AI matcher checks your resume against these skills.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SkillGroup title="Required skills" skills={job.requiredSkills} highlight />
              <SkillGroup title="Preferred / nice to have" skills={job.preferredSkills} />
            </CardContent>
          </Card>

          {job.creator?.name ? (
            <p className="text-xs text-muted-foreground">Posted by {job.creator.name} · HireSphere AI</p>
          ) : null}
        </div>

        {/* Apply panel (sticky on desktop) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Card className="border-primary/30 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  Apply with AI screening
                </CardTitle>
                <CardDescription>
                  Your resume is scored against this job the moment you apply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasApplied ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-muted/40 p-3">
                      <p className="text-sm font-medium">You applied to this job</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={myApplication!.status} />
                        <span className="text-xs text-muted-foreground">current status</span>
                      </div>
                    </div>
                    <Button
                      className="min-h-11 w-full gap-2"
                      onClick={() => router.navigate('#/portal/applications')}
                      aria-label="Open my applications"
                    >
                      View My Applications
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : resumesLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Spinner className="size-4" />
                    Loading your resumes…
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-[color-mix(in_oklch,var(--warning)_10%,transparent)] p-3 text-sm">
                      <Upload className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
                      <p>
                        You need a resume to apply. Upload a PDF in{' '}
                        <button
                          type="button"
                          className="font-medium text-primary underline underline-offset-2"
                          onClick={() => router.navigate('#/portal/profile')}
                        >
                          My Profile
                        </button>{' '}
                        and come back.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="min-h-11 w-full"
                      onClick={() => router.navigate('#/portal/profile')}
                    >
                      Upload a resume
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Choose a resume</Label>
                      <RadioGroup
                        value={selectedResumeId}
                        onValueChange={setSelectedResumeId}
                        className="max-h-56 space-y-1.5 overflow-y-auto pr-1"
                        aria-label="Select resume to apply with"
                      >
                        {resumes.map((r) => (
                          <Label
                            key={r.id}
                            htmlFor={`resume-${r.id}`}
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent',
                              selectedResumeId === r.id && 'border-primary/60 bg-primary/5',
                            )}
                          >
                            <RadioGroupItem id={`resume-${r.id}`} value={r.id} className="mt-0.5" />
                            <span className="min-w-0 flex-1 space-y-1">
                              <span className="flex items-center gap-2">
                                <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <span className="truncate text-sm font-medium">{r.fileName}</span>
                              </span>
                              <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                <StatusBadge
                                  status={r.parseStatus}
                                  label={r.parseStatus === 'SUCCESS' ? 'Parsed' : formatLabel(r.parseStatus)}
                                />
                                {r.isActive ? <Badge variant="secondary">Active</Badge> : null}
                                <span>{formatFileSize(r.fileSize)}</span>
                                <span>· {formatDate(r.uploadedAt)}</span>
                              </span>
                            </span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                    <Button
                      className="min-h-11 w-full gap-2"
                      onClick={() => void handleApply()}
                      disabled={applying || !selectedResumeId}
                      aria-label={`Apply to ${job.title}`}
                    >
                      {applying ? <Spinner className="size-4" /> : <Briefcase className="size-4" aria-hidden="true" />}
                      {applying ? 'Submitting…' : 'Apply now'}
                    </Button>
                    {myApplication?.status === 'WITHDRAWN' ? (
                      <p className="text-xs text-muted-foreground">
                        You previously withdrew an application here — applying again re-opens it as{' '}
                        <span className="font-medium">Applied</span>.
                      </p>
                    ) : null}
                  </>
                )}

                <Separator />
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  The AI match score is a decision-support signal for the hiring team — it never auto-rejects you.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success dialog with AI snapshot */}
      <Dialog open={Boolean(success)} onOpenChange={(o) => !o && setSuccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="size-5 text-[var(--success)]" aria-hidden="true" />
              Application submitted
            </DialogTitle>
            <DialogDescription>
              {job.title} — your resume was scored by the AI screening engine.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 p-4">
            <ScoreRing
              value={success?.analysis?.finalScore ?? success?.matchScore ?? null}
              size={88}
              strokeWidth={9}
              label="AI match"
            />
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Initial match snapshot from TF-IDF text similarity + required-skill overlap. This is a
              decision-support signal, not a hiring decision.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="min-h-11" onClick={() => setSuccess(null)}>
              Stay on this page
            </Button>
            <Button
              className="min-h-11 gap-2"
              onClick={() => {
                setSuccess(null)
                router.navigate('#/portal/applications')
              }}
            >
              My Applications
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetaTile({ icon: Icon, title, caption }: { icon: React.ComponentType<{ className?: string }>; title: string; caption: string }) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <p className="mt-2 truncate text-sm font-medium" title={title}>
        {title}
      </p>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}

function SkillGroup({ title, skills, highlight }: { title: string; skills: string[]; highlight?: boolean }) {
  if (!skills?.length) {
    return (
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground italic">None specified</p>
      </div>
    )
  }
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <Badge
            key={s}
            variant="outline"
            className={cn('font-normal', highlight && 'border-primary/40 bg-primary/10 text-primary')}
          >
            {s}
          </Badge>
        ))}
      </div>
    </div>
  )
}
