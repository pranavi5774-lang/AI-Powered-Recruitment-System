'use client'

// ============================================================
// Candidate Profile — resume manager + editable profile details.
// Data: GET /api/resumes/mine, POST /api/resumes/upload (XHR for
// progress), GET /api/resumes/:id (preview), GET/PATCH
// /api/candidate/profile (own profile editor).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  Sparkles,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react'
import { get, patch, post, ApiError, authHeader, type Paginated } from '@/lib/api-client'
import { useRouter } from '@/lib/router'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreRing } from '@/components/spa/shared/ScoreRing'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/spa/shared/Spinner'
import { formatDate } from '@/components/spa/shared/formatters'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { RESUME_MAX_SIZE } from '@/lib/constants'

type ResumeRow = {
  id: string
  fileName: string
  fileSize: number
  parseStatus: string
  parseError?: string | null
  isActive: boolean
  uploadedAt: string
}

type ResumeDetail = ResumeRow & {
  extractedText: string | null
  parsedData: {
    name?: string | null
    email?: string | null
    phone?: string | null
    education?: string | null
    experienceSummary?: string | null
    experienceYears?: number | null
    certifications?: string | null
    projects?: string | null
    skills?: string[]
    wordCount?: number | null
  } | null
}

type CandidateProfile = {
  id: string
  phone: string | null
  location: string | null
  headline: string | null
  summary: string | null
  experienceYears: number | null
  currentCompany: string | null
  education: string | null
  linkedinUrl: string | null
  githubUrl: string | null
}

const ACCEPT_MIME = 'application/pdf'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProfilePage() {
  const reduce = useReducedMotion()
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Keep your resume and details current — the AI matcher reads them on every application."
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2"
      >
        <ResumeManager />
        <ProfileEditor profileName={user?.name ?? null} />
      </motion.div>
    </div>
  )
}

// ============================================================
// Resume manager
// ============================================================

function ResumeManager() {
  const router = useRouter()
  const [resumes, setResumes] = useState<Paginated<ResumeRow> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [lastUpload, setLastUpload] = useState<ResumeDetail | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewOpenId, setPreviewOpenId] = useState<string | null>(null)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewParsed, setPreviewParsed] = useState<ResumeDetail['parsedData']>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<Paginated<ResumeRow>>('/api/resumes/mine?pageSize=50')
      setResumes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const uploadFile = useCallback(
    (file: File) => {
      if (file.type !== ACCEPT_MIME) {
        toast.error('Only PDF resumes are accepted.', { description: `Got “${file.type || file.name}”.` })
        return
      }
      if (file.size > RESUME_MAX_SIZE) {
        toast.error('Resume is too large.', {
          description: `${formatFileSize(file.size)} exceeds the ${formatFileSize(RESUME_MAX_SIZE)} limit.`,
        })
        return
      }
      if (file.size === 0) {
        toast.error('That file looks empty.')
        return
      }

      setUploading(true)
      setProgress(0)
      const form = new FormData()
      form.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/resumes/upload')
      xhr.withCredentials = true
      // Cookie auth doesn't apply inside the preview iframe (SameSite=Lax
      // cookies are blocked there) — attach the bearer token if present.
      for (const [name, value] of Object.entries(authHeader())) {
        xhr.setRequestHeader(name, value)
      }
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = async () => {
        setUploading(false)
        setProgress(100)
        let json: { ok: boolean; data?: ResumeDetail; error?: { message: string; code?: string } } | null = null
        try {
          json = JSON.parse(xhr.responseText)
        } catch {
          /* handled below */
        }
        if (xhr.status >= 200 && xhr.status < 300 && json?.ok && json.data) {
          const resume = json.data
          toast.success('Resume uploaded', {
            description:
              resume.parseStatus === 'SUCCESS'
                ? 'AI parsing complete — your details were extracted.'
                : 'Uploaded, but automatic parsing failed. You can still apply with it.',
          })
          setLastUpload(resume)
          await load()
        } else {
          const message =
            json?.error?.message ??
            (xhr.status === 401
              ? 'Your session expired — please sign in again.'
              : `Upload failed with status ${xhr.status}.`)
          if (xhr.status === 401) router.navigate('#/login')
          toast.error(message)
        }
      }
      xhr.onerror = () => {
        setUploading(false)
        toast.error('Cannot reach the server. Please check your connection and try again.')
      }
      xhr.send(form)
    },
    [load, router],
  )

  const openPreview = async (resume: ResumeRow) => {
    if (previewOpenId === resume.id) {
      setPreviewOpenId(null)
      setPreviewText(null)
      setPreviewParsed(null)
      return
    }
    setPreviewOpenId(resume.id)
    setPreviewText(null)
    setPreviewParsed(null)
    setPreviewLoading(true)
    try {
      const detail = await get<ResumeDetail>(`/api/resumes/${resume.id}`)
      setPreviewText(detail.extractedText)
      setPreviewParsed(detail.parsedData)
    } catch {
      setPreviewText(null)
      toast.error('Could not load the resume preview.')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Resume manager
          </CardTitle>
          <CardDescription>
            Your newest resume becomes the active one used for new applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload a PDF resume"
            onClick={() => !uploading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                if (!uploading) fileInputRef.current?.click()
              }
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const file = e.dataTransfer.files?.[0]
              if (file && !uploading) uploadFile(file)
            }}
            className={cn(
              'flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors',
              dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-accent/50',
              uploading && 'pointer-events-none opacity-80',
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm font-medium">Uploading… {progress}%</p>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
              </>
            ) : (
              <>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UploadCloud className="size-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium">
                  Drag &amp; drop your resume, or <span className="text-primary underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-muted-foreground">PDF only · up to 5 MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_MIME}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadFile(file)
                e.target.value = ''
              }}
            />
          </div>

          {/* Parse result summary */}
          {lastUpload ? (
            <div
              className={cn(
                'rounded-xl border p-3.5',
                lastUpload.parseStatus === 'SUCCESS'
                  ? 'border-[var(--success)]/30 bg-[color-mix(in_oklch,var(--success)_8%,transparent)]'
                  : 'border-destructive/30 bg-destructive/5',
              )}
              role="status"
            >
              {lastUpload.parseStatus === 'SUCCESS' ? (
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-1.5 font-medium text-[var(--success)]">
                    <Check className="size-4" aria-hidden="true" />
                    Parsed successfully — {lastUpload.parsedData?.skills?.length ?? 0} skills extracted
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {lastUpload.parsedData?.name ? (
                      <span className="inline-flex items-center gap-1">
                        <UserRound className="size-3.5" aria-hidden="true" />
                        {lastUpload.parsedData.name}
                      </span>
                    ) : null}
                    {lastUpload.parsedData?.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="size-3.5" aria-hidden="true" />
                        {lastUpload.parsedData.email}
                      </span>
                    ) : null}
                    {lastUpload.parsedData?.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3.5" aria-hidden="true" />
                        {lastUpload.parsedData.phone}
                      </span>
                    ) : null}
                    {lastUpload.parsedData?.experienceYears != null ? (
                      <span>{lastUpload.parsedData.experienceYears} yrs experience</span>
                    ) : null}
                    {lastUpload.parsedData?.wordCount ? <span>{lastUpload.parsedData.wordCount} words</span> : null}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-1.5 font-medium text-destructive">
                    <X className="size-4" aria-hidden="true" />
                    Upload stored, but parsing failed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lastUpload.parseError ??
                      'We could not read selectable text from this PDF (it may be a scanned image or encrypted).'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tip: export a text-based PDF and try uploading again — AI screening needs readable text.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Resume list */}
          {error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : loading ? (
            <div className="space-y-2" aria-hidden="true">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !resumes || resumes.items.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No resumes yet. Upload your first PDF above to unlock one-click applications.
            </p>
          ) : (
            <ul className="space-y-2" aria-label="My resumes">
              {resumes.items.map((r) => (
                <li key={r.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {r.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(r.fileSize)} · {formatDate(r.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {r.isActive ? <Badge className="bg-primary/15 text-primary">Active</Badge> : null}
                      <StatusBadge
                        status={r.parseStatus}
                        label={r.parseStatus === 'SUCCESS' ? 'Parsed' : r.parseStatus === 'FAILED' ? 'Parse failed' : r.parseStatus}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9 gap-1.5"
                      onClick={() => window.open(`/api/resumes/${r.id}/download`, '_blank', 'noopener')}
                      aria-label={`Download ${r.fileName}`}
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                      Download
                    </Button>
                    <Collapsible open={previewOpenId === r.id} onOpenChange={() => void openPreview(r)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-9 gap-1.5"
                          aria-expanded={previewOpenId === r.id}
                          aria-label={`Preview extracted text of ${r.fileName}`}
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          {previewOpenId === r.id ? 'Hide extract' : 'Preview text'}
                          <ChevronDown
                            className={cn('size-3.5 transition-transform', previewOpenId === r.id && 'rotate-180')}
                            aria-hidden="true"
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </div>
                  {previewOpenId === r.id ? (
                    <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                      {previewLoading ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="size-3.5" /> Loading extracted text…
                        </span>
                      ) : previewParsed && (previewParsed.skills?.length || previewParsed.experienceSummary) ? (
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Extracted summary</p>
                          {previewParsed.experienceSummary ? (
                            <p className="whitespace-pre-line">{previewParsed.experienceSummary}</p>
                          ) : null}
                          {previewParsed.skills?.length ? (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {previewParsed.skills.map((s) => (
                                <Badge key={s} variant="secondary" className="font-normal">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : previewText ? (
                        <p className="max-h-48 overflow-y-auto whitespace-pre-line">{previewText}</p>
                      ) : (
                        <p>No readable text — this PDF is likely a scanned image.</p>
                      )}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Profile editor
// ============================================================

const EMPTY_FORM = {
  phone: '',
  location: '',
  headline: '',
  summary: '',
  currentCompany: '',
  experienceYears: '',
  education: '',
  linkedinUrl: '',
  githubUrl: '',
}

type FormState = typeof EMPTY_FORM

function ProfileEditor({ profileName }: { profileName: string | null }) {
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<CandidateProfile>('/api/candidate/profile')
      setProfile(data)
      setForm({
        phone: data.phone ?? '',
        location: data.location ?? '',
        headline: data.headline ?? '',
        summary: data.summary ?? '',
        currentCompany: data.currentCompany ?? '',
        experienceYears: data.experienceYears != null ? String(data.experienceYears) : '',
        education: data.education ?? '',
        linkedinUrl: data.linkedinUrl ?? '',
        githubUrl: data.githubUrl ?? '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const setField = (key: keyof FormState, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    const years = form.experienceYears.trim()
    if (years && (Number.isNaN(Number(years)) || Number(years) < 0 || Number(years) > 60)) {
      toast.error('Experience must be a number between 0 and 60.')
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        phone: form.phone.trim() || null,
        location: form.location.trim() || null,
        headline: form.headline.trim() || null,
        summary: form.summary.trim() || null,
        currentCompany: form.currentCompany.trim() || null,
        education: form.education.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
        githubUrl: form.githubUrl.trim() || null,
      }
      if (years !== '') body.experienceYears = Number(years)
      const updated = await patch<CandidateProfile>('/api/candidate/profile', body)
      setProfile(updated)
      setForm((f) => ({
        ...f,
        linkedinUrl: updated.linkedinUrl ?? '',
        githubUrl: updated.githubUrl ?? '',
      }))
      // refresh the auth store snapshot (topbar / dashboards read candidateProfile)
      await useAuthStore.getState().fetchMe()
      toast.success('Profile updated.')
      setEditing(false)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        toast.error('Please check the highlighted fields — some values are invalid.')
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save profile')
      }
    } finally {
      setSaving(false)
    }
  }

  const completeness = (() => {
    const fields = [profile?.phone, profile?.headline, profile?.education, profile?.summary]
    return Math.round((40 + fields.filter(Boolean).length * 15) as number)
  })()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pencil className="size-4 text-primary" aria-hidden="true" />
              Profile details
            </CardTitle>
            <CardDescription>Shown to recruiters alongside your resume.</CardDescription>
          </div>
          {!loading && !error ? (
            editing ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-9"
                  onClick={() => {
                    setEditing(false)
                    void load() // revert
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button size="sm" className="min-h-9 gap-1.5" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? <Spinner className="size-3.5" /> : <Save className="size-3.5" aria-hidden="true" />}
                  Save
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </Button>
            )
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : loading ? (
            <div className="space-y-3" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <>
              {/* read-only snapshot header */}
              {!editing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                    <ScoreRing value={completeness} size={64} strokeWidth={6} label="complete" />
                    <div className="min-w-0 space-y-0.5 text-sm">
                      <p className="font-medium">{profileName ?? 'Candidate'}</p>
                      <p className="text-muted-foreground">{profile?.headline || 'No headline yet'}</p>
                      <p className="text-xs text-muted-foreground">
                        {[profile?.location, profile?.currentCompany].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Phone" value={profile?.phone} icon={Phone} />
                    <Field label="Location" value={profile?.location} />
                    <Field label="Experience" value={profile?.experienceYears != null ? `${profile.experienceYears} years` : null} icon={Sparkles} />
                    <Field label="Education" value={profile?.education} />
                    <Field label="LinkedIn" value={profile?.linkedinUrl} />
                    <Field label="GitHub" value={profile?.githubUrl} />
                    <div className="sm:col-span-2">
                      <Field label="Summary" value={profile?.summary} multiline />
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Phone" value={form.phone} onChange={(v) => setField('phone', v)} placeholder="+91 …" />
                  <FormField label="Location" value={form.location} onChange={(v) => setField('location', v)} placeholder="City, Country" />
                  <div className="sm:col-span-2">
                    <FormField label="Headline" value={form.headline} onChange={(v) => setField('headline', v)} placeholder="e.g. Frontend Developer — React & UI" />
                  </div>
                  <FormField label="Current company" value={form.currentCompany} onChange={(v) => setField('currentCompany', v)} placeholder="Optional" />
                  <FormField
                    label="Experience (years)"
                    value={form.experienceYears}
                    onChange={(v) => setField('experienceYears', v.replace(/[^\d]/g, ''))}
                    placeholder="e.g. 2"
                    inputMode="numeric"
                  />
                  <div className="sm:col-span-2">
                    <FormField label="Education" value={form.education} onChange={(v) => setField('education', v)} placeholder="Degree, Institute, Year" />
                  </div>
                  <FormField label="LinkedIn URL" value={form.linkedinUrl} onChange={(v) => setField('linkedinUrl', v)} placeholder="https://linkedin.com/in/…" />
                  <FormField label="GitHub URL" value={form.githubUrl} onChange={(v) => setField('githubUrl', v)} placeholder="https://github.com/…" />
                  <div className="sm:col-span-2">
                    <Label htmlFor="f-summary" className="text-sm font-medium">
                      Summary
                    </Label>
                    <Textarea
                      id="f-summary"
                      value={form.summary}
                      onChange={(e) => setField('summary', e.target.value)}
                      placeholder="A short professional summary recruiters read first…"
                      className="mt-1.5 min-h-24"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label: fieldLabel,
  value,
  icon: Icon,
  multiline,
}: {
  label: string
  value: string | null | undefined
  icon?: React.ComponentType<{ className?: string }>
  multiline?: boolean
}) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        {fieldLabel}
      </dt>
      <dd className={cn('mt-1 text-sm', multiline && 'whitespace-pre-line leading-relaxed')}>
        {value ? value : <span className="text-muted-foreground italic">Not added yet</span>}
      </dd>
    </div>
  )
}

function FormField({
  label: fieldLabel,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: 'numeric' | 'text'
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${fieldLabel.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="text-sm font-medium">
        {fieldLabel}
      </Label>
      <Input
        id={`f-${fieldLabel.toLowerCase().replace(/[^a-z]+/g, '-')}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-10"
      />
    </div>
  )
}
