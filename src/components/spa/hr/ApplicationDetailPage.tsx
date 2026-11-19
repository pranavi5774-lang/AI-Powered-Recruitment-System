'use client'

// ============================================================
// HR — Application detail: THE AI SCREENING WORKSPACE.
// Data: GET /api/applications/:id (job, candidate, resume,
//       analysis, statusHistory, interviews — all included)
// Actions:
//   - Re-run AI analysis      POST /api/ai/analyze/:id
//   - Status transitions      PATCH /api/applications/:id/status
//   - HR notes                PATCH /api/applications/:id/notes
//   - Schedule interview      POST /api/applications/:id/interviews
//   - Create employee record  POST /api/employees/hire/:id (idempotent)
// ============================================================

import * as React from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  Award,
  Banknote,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock,
  Download,
  FileText,
  GraduationCap,
  History,
  Info,
  MapPin,
  RefreshCw,
  Save,
  Sparkles,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { get, post, patch } from '@/lib/api-client'
import { APPLICATION_TRANSITIONS, INTERVIEW_MODES } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreBar } from '@/components/spa/shared/ScoreBar'
import { ScoreRing } from '@/components/spa/shared/ScoreRing'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonRows } from '@/components/spa/shared/Loading'
import { confirmDialog } from '@/components/spa/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime, formatMoneyINR, formatSalaryRange, label, initialsOf } from '@/components/spa/shared/formatters'
import { useRouter } from '@/lib/router'
import { cn } from '@/lib/utils'

type MatchedSkill = { skill: string; alias?: string; evidence?: string; required?: boolean }

type Analysis = {
  id: string
  tfidfScore: number | null
  skillScore: number | null
  finalScore: number | null
  weights: { tfidf: number; skill: number } | null
  matchedSkills: MatchedSkill[]
  missingSkills: string[]
  extraSkills: string[]
  extractedInfo: {
    name?: string | null
    email?: string | null
    phone?: string | null
    education?: string | null
    experienceSummary?: string | null
    experienceYears?: number | null
    skills?: string[] | null
    certifications?: string | null
    projects?: string | null
  } | null
    parameterWeights: Record<string, number>
    parameterScores: {
      key: string
      name: string
      score: number
      weight: number
      contribution: number
      explanation: string
      evidence: string[]
      gaps: string[]
    }[]
    strengths: string[]
    skillGaps: string[]
    recommendation: string
    detailedExplanation: string | null
  summary: string | null
  algorithmVersion: string
  createdAt: string
}

type AppDetail = {
  id: string
  jobId: string
  resumeId: string | null
  status: string
  matchScore: number | null
  tfidfScore: number | null
  skillScore: number | null
  hrNotes: string | null
  appliedAt: string
  updatedAt: string
  job: {
    id: string
    title: string
    location: string
    employmentType: string
    status: string
    requiredSkills: string[]
    preferredSkills: string[]
    salaryMin: number | null
    salaryMax: number | null
    department: { id: string; name: string } | null
  }
  candidate: {
    id: string
    name: string
    email: string
    phone?: string | null
    experienceYears?: number | null
    education?: string | null
    headline?: string | null
  }
  resume: {
    id: string
    fileName: string
    fileSize: number
    parseStatus: string
    parseError: string | null
    uploadedAt: string
    extractedText: string | null
  } | null
  analysis: Analysis | null
  statusHistory: {
    id: string
    fromStatus: string | null
    toStatus: string
    actorName: string
    actorRole: string
    note: string | null
    createdAt: string
  }[]
  interviews: {
    id: string
    scheduledAt: string
    mode: string
    locationOrLink: string | null
    notes: string | null
    status: string
  }[]
  hrReviews: {
    id: string
    reviewerName: string
    decision: string
    reason: string | null
    comments: string | null
    createdAt: string
  }[]
  evaluationHistory: {
    id: string
    finalScore: number
    recommendation: string
    algorithmVersion: string
    createdAt: string
  }[]
}

type Department = { id: string; name: string }

const HISTORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  APPLIED: CircleDot,
  UNDER_REVIEW: Clock,
  SHORTLISTED: Sparkles,
  INTERVIEW: CalendarClock,
  SELECTED: Award,
  HIRED: CheckCircle2,
  REJECTED: XCircle,
  WITHDRAWN: History,
}

export function ApplicationDetailPage({ params }: { params: Record<string, string> }) {
  const router = useRouter()
  const reduce = useReducedMotion()
  const [app, setApp] = React.useState<AppDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)

  // workflow local state
  const [transitionNote, setTransitionNote] = React.useState('')
  const [notesDraft, setNotesDraft] = React.useState('')
  const [reviewReason, setReviewReason] = React.useState('')
  const [reviewComments, setReviewComments] = React.useState('')

  // interview dialog
  const [ivOpen, setIvOpen] = React.useState(false)
  const [ivForm, setIvForm] = React.useState({ scheduledAt: '', mode: 'ONSITE', locationOrLink: '', notes: '' })

  // hire dialog
  const [hireOpen, setHireOpen] = React.useState(false)
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [hireForm, setHireForm] = React.useState({ designation: '', departmentId: 'NONE', joiningDate: '', workEmail: '' })

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<AppDetail>(`/api/applications/${params.id}`)
      setApp(data)
      setNotesDraft(data.hrNotes ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the application')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  React.useEffect(() => {
    void load()
  }, [load])

  // ---------------- actions ----------------

  const rerunAnalysis = async () => {
    const okToGo = await confirmDialog({
      title: 'Re-run AI analysis?',
      description: 'The resume will be re-scored against the job with the current algorithm. The previous result is replaced.',
      confirmText: 'Re-run analysis',
    })
    if (!okToGo) return
    setBusy('analysis')
    try {
      const data = await post<{ application: AppDetail; analysis: Analysis }>(`/api/ai/analyze/${params.id}`)
      toast.success('AI analysis refreshed.')
      if (data.analysis) {
        setApp((prev) => (prev ? { ...prev, analysis: data.analysis } : prev))
      } else {
        void load()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI analysis failed')
    } finally {
      setBusy(null)
    }
  }

  const retryAnalysis = async () => {
    setBusy('analysis')
    try {
      await post(`/api/ai/analyze/${params.id}`)
      toast.success('AI analysis completed.')
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI analysis failed')
    } finally {
      setBusy(null)
    }
  }

  const transition = async (to: string) => {
    if (!app) return
    const destructive = to === 'REJECTED'
    const okToGo = await confirmDialog({
      title: `Move to ${label(to)}?`,
      description: destructive
        ? 'The candidate will be notified. You can re-evaluate later (Rejected → Shortlisted is allowed).'
        : `The candidate will be notified about the move to ${label(to)}.`,
      confirmText: `Move to ${label(to)}`,
      destructive,
    })
    if (!okToGo) return
    setBusy(`status-${to}`)
    try {
      await patch(`/api/applications/${app.id}/status`, {
        status: to,
        note: transitionNote.trim() || undefined,
      })
      toast.success(`Status updated to ${label(to)}. Candidate notified.`)
      setTransitionNote('')
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not change the status')
    } finally {
      setBusy(null)
    }
  }

  const saveNotes = async () => {
    if (!app) return
    setBusy('notes')
    try {
      await patch(`/api/applications/${app.id}/notes`, { hrNotes: notesDraft })
      toast.success('HR notes saved.')
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save notes')
    } finally {
      setBusy(null)
    }
  }

  const recordReview = async (decision: 'APPROVED' | 'REJECTED' | 'OVERRIDDEN') => {
      if (decision !== 'APPROVED' && !reviewReason.trim()) {
        toast.error('Add a reason before rejecting or overriding the recommendation.')
        return
      }
      setBusy(`review-${decision}`)
      try {
        await post(`/api/applications/${params.id}/reviews`, {
          decision,
          reason: reviewReason.trim() || undefined,
          comments: reviewComments.trim() || undefined,
        })
        toast.success('Human review recorded.')
        setReviewReason('')
        setReviewComments('')
        await load()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not save the review')
      } finally {
        setBusy(null)
    }
  }

  const scheduleInterview = async () => {
    if (!app) return
    if (!ivForm.scheduledAt) {
      toast.error('Pick a date and time for the interview.')
      return
    }
    setBusy('interview')
    try {
      await post(`/api/applications/${app.id}/interviews`, {
        scheduledAt: new Date(ivForm.scheduledAt).toISOString(),
        mode: ivForm.mode,
        locationOrLink: ivForm.locationOrLink.trim() || undefined,
        notes: ivForm.notes.trim() || undefined,
      })
      toast.success('Interview scheduled — candidate notified.')
      setIvOpen(false)
      setIvForm({ scheduledAt: '', mode: 'ONSITE', locationOrLink: '', notes: '' })
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not schedule the interview')
    } finally {
      setBusy(null)
    }
  }

  const openHireDialog = async () => {
    if (!app) return
    setHireForm({
      designation: app.job.title,
      departmentId: app.job.department?.id ?? 'NONE',
      joiningDate: new Date().toISOString().slice(0, 10),
      workEmail: app.candidate.email,
    })
    if (departments.length === 0) {
      try {
        const data = await get<{ items: Department[] }>('/api/departments')
        setDepartments(data.items)
      } catch {
        // optional select
      }
    }
    setHireOpen(true)
  }

  const createEmployee = async () => {
    if (!app) return
    if (!hireForm.designation.trim()) {
      toast.error('Designation is required.')
      return
    }
    setBusy('hire')
    try {
      const resp = await post<{ alreadyCreated: boolean; employee: { id: string; employeeCode: string; name: string } }>(
        `/api/employees/hire/${app.id}`,
        {
          designation: hireForm.designation.trim(),
          departmentId: hireForm.departmentId !== 'NONE' ? hireForm.departmentId : undefined,
          joiningDate: hireForm.joiningDate || undefined,
          workEmail: hireForm.workEmail.trim() || undefined,
        },
      )
      if (resp.alreadyCreated) {
        toast.info(`Employee record already exists (${resp.employee.employeeCode}).`)
      } else {
        toast.success(`Employee record created: ${resp.employee.employeeCode}. Portal access granted.`)
      }
      setHireOpen(false)
      router.navigate(`#/hr/employees/${resp.employee.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the employee record')
    } finally {
      setBusy(null)
    }
  }

  // ---------------- render ----------------

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <SkeletonRows rows={2} />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-xl border bg-card lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-xl border bg-card" />
        </div>
        <span className="sr-only">Loading application</span>
      </div>
    )
  }

  if (error || !app) {
    return (
      <div className="space-y-6">
        <PageHeader title="Application" />
        <ErrorState title="Could not load this application" message={error ?? 'Not found'} onRetry={() => void load()} />
      </div>
    )
  }

  const a = app.analysis
  const transitions = APPLICATION_TRANSITIONS[app.status] ?? []
  const canScheduleInterview =
    transitions.includes('INTERVIEW') || app.status === 'INTERVIEW' || app.status === 'SELECTED'
  const resumeText = app.resume?.extractedText ?? null

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <PageHeader
        title={app.candidate.name}
        description={`Applied ${formatDateTime(app.appliedAt)} for ${app.job.title}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            {app.resume ? (
              <Button
                variant="outline"
                size="sm"
                className="min-h-9 gap-1.5"
                onClick={() => window.open(`/api/resumes/${app.resume!.id}/download`, '_blank', 'noopener')}
                aria-label="Download the original resume"
              >
                <Download className="size-4" aria-hidden="true" />
                View Resume
              </Button>
            ) : null}
            <Button
              size="sm"
              className="min-h-9 gap-1.5"
              onClick={() => void rerunAnalysis()}
              disabled={busy === 'analysis'}
            >
              <RefreshCw className={cn('size-4', busy === 'analysis' && 'animate-spin')} aria-hidden="true" />
              Re-run analysis
            </Button>
          </>
        }
      />

      {/* ---- Advisory banner ---- */}
      <div
        role="note"
        className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
        <p>
          <span className="font-medium">AI scores are decision-support signals only.</span> They highlight textual and
          skill overlap — they do not reject candidates, measure integrity, or predict performance. Every progression
          decision belongs to you, the HR reviewer.
        </p>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        {/* ================= LEFT COLUMN ================= */}
        <div className="space-y-4 lg:col-span-2">
          {/* ---- AI analysis panel ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="size-4 text-primary" aria-hidden="true" />
                AI Screening Analysis
              </CardTitle>
              <CardDescription>
                Explainable match between the resume and this job's requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {a ? (
                <div className="space-y-6">
                  {/* scores */}
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="flex flex-col items-center gap-1">
                      <ScoreRing value={a.finalScore ?? app.matchScore} size={104} strokeWidth={9} label="final" />
                      <p className="text-xs text-muted-foreground">Final score</p>
                    </div>
                    <div className="w-full flex-1 space-y-3">
                      <ScoreBar value={a.tfidfScore} label="TF-IDF text similarity" />
                      <ScoreBar value={a.skillScore} label="Required-skill overlap" />
                      <p className="text-[11px] text-muted-foreground">
                        Algorithm: <code>{a.algorithmVersion}</code> • weights{' '}
                        {a.weights
                          ? `${Math.round(a.weights.tfidf * 100)}% TF-IDF / ${Math.round(a.weights.skill * 100)}% skill-overlap (stored on this record)`
                          : 'stored on this record'}
                        {' • '}
                        analyzed {formatDateTime(a.createdAt)}
                      </p>
                    </div>
                  </div>

                  {a.summary ? (
                    <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        <Sparkles className="size-3.5" aria-hidden="true" />
                        Plain-language summary
                      </p>
                      {a.summary}
                    </div>
                  ) : null}

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">Shortlisting recommendation: {label(a.recommendation)}</p>
                        <p className="text-xs text-muted-foreground">Configurable HR thresholds; advisory only, never an automatic decision.</p>
                      </div>
                      <Badge variant="outline">{Math.round((a.finalScore ?? app.matchScore ?? 0) * 100)} / 100</Badge>
                    </div>
                    <div className="space-y-3">
                      {a.parameterScores.map((parameter) => (
                        <div key={parameter.key} className="space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-medium">{parameter.name} <span className="text-muted-foreground">({parameter.weight}%)</span></span>
                            <span className="tabular-nums">{parameter.score}/100 · {parameter.contribution.toFixed(2)} weighted points</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${parameter.name} score`} aria-valuenow={parameter.score} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${parameter.score}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">{parameter.explanation}</p>
                          {parameter.evidence.length ? <p className="text-xs text-foreground/80">Evidence: {parameter.evidence.join(' · ')}</p> : null}
                          {parameter.gaps.length ? <p className="text-xs text-amber-700 dark:text-amber-300">Not evidenced: {parameter.gaps.join(', ')}</p> : null}
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium">Strengths with resume evidence</p>
                        {a.strengths.length ? <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">{a.strengths.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">No high-confidence strengths extracted.</p>}
                      </div>
                      <div>
                        <p className="text-xs font-medium">Skill gaps / information not provided</p>
                        {a.skillGaps.length ? <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">{a.skillGaps.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">No gaps were identified.</p>}
                      </div>
                    </div>
                    <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                      {a.detailedExplanation ?? 'This deterministic score is based only on extracted resume evidence and job requirements. Not Provided is not proof of lacking a qualification. HR retains all shortlist, rejection, interview, and hiring decisions.'}
                    </p>
                  </div>
                  {app.evaluationHistory.length > 1 ? (
                    <Collapsible>
                      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-accent/50">
                        Previous evaluation snapshots ({app.evaluationHistory.length - 1})
                        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-2 space-y-2">
                          {app.evaluationHistory.slice(1).map((entry) => (
                            <li key={entry.id} className="flex flex-wrap justify-between gap-2 rounded-md border p-2 text-xs">
                              <span>{formatDateTime(entry.createdAt)} · {entry.algorithmVersion}</span>
                              <span className="font-medium">{Math.round(entry.finalScore * 100)}% · {label(entry.recommendation)}</span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}

                  {/* matched skills */}
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <CheckCircle2 className="size-3.5 text-[var(--success)]" aria-hidden="true" />
                      Matched skills
                      <span className="font-normal normal-case">({a.matchedSkills.length}) — click for resume evidence</span>
                    </p>
                    {a.matchedSkills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No required skills were evidenced in the resume.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {a.matchedSkills.map((m) => (
                          <Popover key={m.skill}>
                            <PopoverTrigger asChild>
                              <Badge
                                className="cursor-pointer bg-primary/15 text-primary hover:bg-primary/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                tabIndex={0}
                                role="button"
                                aria-label={`Evidence for ${m.skill}`}
                              >
                                {m.skill}
                                {m.required === false ? <span className="ml-1 text-[10px] opacity-70">(preferred)</span> : null}
                              </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 text-sm" role="dialog" aria-label={`Evidence for ${m.skill}`}>
                              <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                Resume evidence
                              </p>
                              <p className="rounded bg-muted/60 p-2 font-mono text-xs leading-relaxed">
                                “{m.evidence?.trim() || 'Skill listed in the resume skill section.'}”
                              </p>
                              {m.alias && m.alias !== m.skill.toLowerCase() ? (
                                <p className="mt-1.5 text-[11px] text-muted-foreground">
                                  Matched via alias “{m.alias}”.
                                </p>
                              ) : null}
                            </PopoverContent>
                          </Popover>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* missing skills */}
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <XCircle className="size-3.5 text-destructive" aria-hidden="true" />
                      Missing skills
                      <span className="font-normal normal-case">— not evidenced in resume</span>
                    </p>
                    {a.missingSkills.length === 0 ? (
                      <p className="text-sm text-[var(--success)]">All required skills were evidenced. 🎯</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {a.missingSkills.map((s) => (
                          <Badge key={s} className="bg-destructive/15 text-destructive">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* extra skills */}
                  <div>
                    <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Additional skills found in resume
                    </p>
                    {a.extraSkills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">None beyond the requirements.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {a.extraSkills.map((s) => (
                          <Badge key={s} className="bg-muted text-muted-foreground">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* extracted info */}
                  {a.extractedInfo ? (
                    <Collapsible>
                      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                        <span className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                          Structured data extracted from the resume
                        </span>
                        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <dl className="mt-3 grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-muted-foreground">Education</dt>
                            <dd>{a.extractedInfo.education ?? app.candidate.education ?? '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Experience (parsed)</dt>
                            <dd>
                              {a.extractedInfo.experienceYears !== null && a.extractedInfo.experienceYears !== undefined
                                ? `${a.extractedInfo.experienceYears} year${a.extractedInfo.experienceYears === 1 ? '' : 's'}`
                                : app.candidate.experienceYears ?? '—'}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-muted-foreground">Experience summary</dt>
                            <dd className="whitespace-pre-line">{a.extractedInfo.experienceSummary ?? '—'}</dd>
                          </div>
                          {a.extractedInfo.skills && a.extractedInfo.skills.length > 0 ? (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-muted-foreground">Skills listed in resume</dt>
                              <dd>{a.extractedInfo.skills.join(', ')}</dd>
                            </div>
                          ) : null}
                          {a.extractedInfo.certifications ? (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-muted-foreground">Certifications</dt>
                              <dd className="whitespace-pre-line">{a.extractedInfo.certifications}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}
                </div>
              ) : app.resume?.parseStatus === 'FAILED' ? (
                <div className="space-y-4">
                  <ErrorState
                    title="The resume could not be parsed"
                    message={
                      app.resume.parseError
                        ? `Parser message: ${app.resume.parseError}`
                        : 'The uploaded file could not be read as text (it may be a scanned/image-only or encrypted PDF).'
                    }
                  />
                  <div className="flex justify-center">
                    <Button className="min-h-9 gap-1.5" onClick={() => void retryAnalysis()} disabled={busy === 'analysis'}>
                      <RefreshCw className={cn('size-4', busy === 'analysis' && 'animate-spin')} aria-hidden="true" />
                      Retry AI analysis
                    </Button>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
        You can still screen this candidate manually using the resume PDF and the workflow below.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ErrorState
                    title="No AI analysis yet"
                    message="The resume has not been scored. Run the analyzer to get an explainable match score."
                  />
                  <div className="flex justify-center">
                    <Button className="min-h-9 gap-1.5" onClick={() => void retryAnalysis()} disabled={busy === 'analysis'}>
                      <Sparkles className="size-4" aria-hidden="true" />
                      Run AI analysis
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Status workflow ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <CircleDot className="size-4 text-primary" aria-hidden="true" />
                  Pipeline workflow
                </span>
                <StatusBadge status={app.status} />
              </CardTitle>
              <CardDescription>
                Legal next transitions for {label(app.status)}. Every change is logged and the candidate is notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div>
                  <p className="text-sm font-medium">Human review of AI recommendation</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Record your review separately. This does not change application status; use the workflow controls below for any status decision.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="review-reason">Reason (required for reject/override)</Label>
                    <Input id="review-reason" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} maxLength={1000} placeholder="Explain the human review decision" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="review-comments">Review comments</Label>
                    <Textarea id="review-comments" rows={2} value={reviewComments} onChange={(event) => setReviewComments(event.target.value)} maxLength={2000} placeholder="Optional notes for the review record" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={busy?.startsWith('review-')} onClick={() => void recordReview('APPROVED')}>Approve recommendation</Button>
                  <Button size="sm" variant="outline" className="text-destructive" disabled={busy?.startsWith('review-') || !reviewReason.trim()} onClick={() => void recordReview('REJECTED')}>Reject recommendation</Button>
                  <Button size="sm" variant="outline" disabled={busy?.startsWith('review-') || !reviewReason.trim()} onClick={() => void recordReview('OVERRIDDEN')}>Override AI recommendation</Button>
                </div>
                {app.hrReviews.length ? (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-medium">Review history</p>
                    {app.hrReviews.map((review) => (
                      <div key={review.id} className="rounded-md bg-background/80 p-2 text-xs">
                        <p className="font-medium">{label(review.decision)} · {review.reviewerName} · {formatDateTime(review.createdAt)}</p>
                        {review.reason ? <p className="mt-1 text-muted-foreground">Reason: {review.reason}</p> : null}
                        {review.comments ? <p className="mt-1 text-muted-foreground">{review.comments}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {transitions.length === 0 ? (
                <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {label(app.status)} is a terminal state — no further transitions are allowed by policy.
                </p>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="tr-note">Note (optional, attached to the status change)</Label>
                    <Input
                      id="tr-note"
                      value={transitionNote}
                      onChange={(e) => setTransitionNote(e.target.value)}
                      placeholder="e.g. Strong React portfolio — moving to interview"
                      maxLength={300}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {transitions.map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={t === 'REJECTED' ? 'outline' : 'default'}
                        className={cn(
                          'min-h-9',
                          t === 'REJECTED' && 'text-destructive hover:text-destructive',
                        )}
                        onClick={() => void transition(t)}
                        disabled={busy === `status-${t}`}
                        aria-label={`Move application to ${label(t)}`}
                      >
                        {busy === `status-${t}` ? '…' : label(t)}
                      </Button>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              {/* HR notes */}
              <div className="grid gap-2">
                <Label htmlFor="hr-notes" className="flex items-center gap-1.5">
                  <FileText className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  HR notes (internal, never shown to the candidate)
                </Label>
                <Textarea
                  id="hr-notes"
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Screening impressions, interview feedback references, salary discussion…"
                />
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="min-h-9 gap-1.5" onClick={() => void saveNotes()} disabled={busy === 'notes' || notesDraft === (app.hrNotes ?? '')}>
                    <Save className="size-4" aria-hidden="true" />
                    Save notes
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Interviews */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
                    Interviews
                  </p>
                  {canScheduleInterview ? (
                    <Button size="sm" variant="outline" className="min-h-9 gap-1.5" onClick={() => setIvOpen(true)}>
                      <CalendarClock className="size-4" aria-hidden="true" />
                      Schedule interview
                    </Button>
                  ) : null}
                </div>
                {app.interviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {canScheduleInterview
                      ? 'No interviews scheduled yet.'
                      : 'Interview scheduling unlocks once the candidate reaches the Interview stage.'}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {app.interviews.map((iv) => (
                      <li key={iv.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{formatDateTime(iv.scheduledAt)}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{label(iv.mode)}</Badge>
                            <StatusBadge status={iv.status} />
                          </div>
                        </div>
                        {iv.locationOrLink ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="size-3" aria-hidden="true" />
                            {iv.locationOrLink}
                          </p>
                        ) : null}
                        {iv.notes ? <p className="mt-1 text-xs text-muted-foreground">{iv.notes}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Hire CTA */}
              {app.status === 'HIRED' ? (
                <div className="rounded-lg border border-[color-mix(in_oklch,var(--success)_35%,transparent)] bg-[color-mix(in_oklch,var(--success)_10%,transparent)] p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-[var(--success)]">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Candidate hired
                  </p>
                  <p className="mt-1 text-xs text-foreground/80">
                    Create the employee record to provision portal access, leave balances and attendance tracking. This
                    action is idempotent — it is safe to click again.
                  </p>
                  <Button size="sm" className="mt-3 min-h-9 gap-1.5" onClick={() => void openHireDialog()}>
                    <UserPlus className="size-4" aria-hidden="true" />
                    Create Employee Record
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="space-y-4">
          {/* candidate card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Candidate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
                  aria-hidden="true"
                >
                  {initialsOf(app.candidate.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{app.candidate.name}</p>
                  {app.candidate.headline ? (
                    <p className="truncate text-xs text-muted-foreground">{app.candidate.headline}</p>
                  ) : null}
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate">{app.candidate.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{app.candidate.phone ?? (a?.extractedInfo?.phone ?? '—')}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Experience</dt>
                  <dd>
                    {a?.extractedInfo?.experienceYears !== null && a?.extractedInfo?.experienceYears !== undefined
                      ? `${a.extractedInfo.experienceYears} yrs (from resume)`
                      : app.candidate.experienceYears
                        ? `${app.candidate.experienceYears} yrs (profile)`
                        : '—'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">Education</dt>
                  <dd className="text-right">
                    {a?.extractedInfo?.education ?? app.candidate.education ?? '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* job summary card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Applied role
                <StatusBadge status={app.job.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link href={`#/hr/jobs/${app.job.id}`} className="font-medium text-foreground hover:text-primary">
                {app.job.title}
              </Link>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Users className="size-3.5 shrink-0" aria-hidden="true" />
                  {app.job.department?.name ?? 'No department'}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  {app.job.location} • {label(app.job.employmentType)}
                </li>
                <li className="flex items-center gap-2">
                  <Banknote className="size-3.5 shrink-0" aria-hidden="true" />
                  {formatSalaryRange(app.job.salaryMin, app.job.salaryMax)}
                </li>
                <li className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="text-foreground">Required:</span>{' '}
                    {app.job.requiredSkills.length > 0 ? app.job.requiredSkills.join(', ') : '—'}
                  </span>
                </li>
              </ul>
              <Button asChild variant="outline" size="sm" className="w-full min-h-9">
                <a href={`#/hr/jobs/${app.job.id}`}>Open job</a>
              </Button>
            </CardContent>
          </Card>

          {/* resume panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                  Resume
                </span>
                {app.resume ? <StatusBadge status={app.resume.parseStatus} /> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {app.resume ? (
                <>
                  <p className="truncate font-medium" title={app.resume.fileName}>
                    {app.resume.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(app.resume.fileSize / 1024).toFixed(0)} KB • uploaded {formatDate(app.resume.uploadedAt)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full min-h-9 gap-1.5"
                    onClick={() => window.open(`/api/resumes/${app.resume!.id}/download`, '_blank', 'noopener')}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download resume
                  </Button>
                  {resumeText ? (
                    <Collapsible>
                      <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border p-2.5 text-sm font-medium hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                        Extracted text
                        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed scroll-slim">
                          {resumeText}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No text could be extracted — the PDF may be image-only. Use “                      Download original resume” to read it manually.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No resume attached to this application.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ---- Status history timeline ---- */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-primary" aria-hidden="true" />
              Status history
            </CardTitle>
            <CardDescription>Chronological audit of every pipeline movement, actor and note.</CardDescription>
          </CardHeader>
          <CardContent>
            {app.statusHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history recorded.</p>
            ) : (
              <ol className="relative space-y-6 border-l pl-6">
                {app.statusHistory.map((h) => {
                  const Icon = HISTORY_ICONS[h.toStatus] ?? CircleDot
                  return (
                    <li key={h.id} className="relative">
                      <span
                        className="absolute top-0 -left-[31px] flex size-6 items-center justify-center rounded-full border bg-card"
                        aria-hidden="true"
                      >
                        <Icon className="size-3 text-primary" />
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={h.toStatus} />
                        {h.fromStatus ? (
                          <>
                            <span className="text-xs text-muted-foreground">from</span>
                            <Badge variant="outline">{label(h.fromStatus)}</Badge>
                          </>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-sm">
                        <span className="font-medium">{h.actorName}</span>
                        <span className="text-muted-foreground"> ({label(h.actorRole)})</span>
                        <span className="ml-2 text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                      </p>
                      {h.note ? (
                        <p className="mt-1 rounded bg-muted/50 px-2.5 py-1.5 text-xs text-foreground/85">“{h.note}”</p>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ---- Interview dialog ---- */}
      <Dialog open={ivOpen} onOpenChange={setIvOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule interview</DialogTitle>
            <DialogDescription>
              {app.candidate.name} — for {app.job.title}. The candidate is notified automatically and the application
              moves to Interview when legal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="iv-at">Date & time</Label>
              <Input
                id="iv-at"
                type="datetime-local"
                value={ivForm.scheduledAt}
                onChange={(e) => setIvForm({ ...ivForm, scheduledAt: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iv-mode">Mode</Label>
              <Select value={ivForm.mode} onValueChange={(v) => setIvForm({ ...ivForm, mode: v })}>
                <SelectTrigger id="iv-mode" aria-label="Interview mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVIEW_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {label(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iv-loc">Location / meeting link</Label>
              <Input
                id="iv-loc"
                value={ivForm.locationOrLink}
                onChange={(e) => setIvForm({ ...ivForm, locationOrLink: e.target.value })}
                placeholder="e.g. Bengaluru Office — Room 4 or https://meet…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="iv-notes">Notes</Label>
              <Textarea
                id="iv-notes"
                rows={2}
                value={ivForm.notes}
                onChange={(e) => setIvForm({ ...ivForm, notes: e.target.value })}
                placeholder="Panel, round, preparation requested from the candidate…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIvOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void scheduleInterview()} disabled={busy === 'interview'} className="min-h-9">
              {busy === 'interview' ? 'Scheduling…' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Hire dialog ---- */}
      <Dialog open={hireOpen} onOpenChange={setHireOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create employee record</DialogTitle>
            <DialogDescription>
              Converts {app.candidate.name} into an employee: generates an employee code, creates this year's leave
              balances and upgrades their login to the employee portal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="h-desig">Designation *</Label>
              <Input
                id="h-desig"
                value={hireForm.designation}
                onChange={(e) => setHireForm({ ...hireForm, designation: e.target.value })}
                placeholder="e.g. Frontend Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="h-dept">Department</Label>
              <Select value={hireForm.departmentId} onValueChange={(v) => setHireForm({ ...hireForm, departmentId: v })}>
                <SelectTrigger id="h-dept" aria-label="Department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No department</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="h-date">Joining date</Label>
                <Input
                  id="h-date"
                  type="date"
                  value={hireForm.joiningDate}
                  onChange={(e) => setHireForm({ ...hireForm, joiningDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="h-email">Work email</Label>
                <Input
                  id="h-email"
                  type="email"
                  value={hireForm.workEmail}
                  onChange={(e) => setHireForm({ ...hireForm, workEmail: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Salary band from the job ({formatMoneyINR(app.job.salaryMin)} – {formatMoneyINR(app.job.salaryMax)}) is
              reference only — formal compensation is handled in the offer letter.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHireOpen(false)} className="min-h-9">
              Cancel
            </Button>
            <Button onClick={() => void createEmployee()} disabled={busy === 'hire'} className="min-h-9 gap-1.5">
              <UserPlus className="size-4" aria-hidden="true" />
              {busy === 'hire' ? 'Creating…' : 'Create record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
