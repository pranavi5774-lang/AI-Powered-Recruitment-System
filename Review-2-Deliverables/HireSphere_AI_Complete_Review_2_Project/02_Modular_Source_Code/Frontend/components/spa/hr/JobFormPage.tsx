'use client'

// ============================================================
// HR — Job create/edit form.
// Create: POST /api/jobs   Edit: GET + PATCH /api/jobs/:id
// Matches the server-side zod schema exactly (see api/jobs/route.ts):
// title 3-120, description 20-8000, skills ≤15 items of ≤60 chars.
// ============================================================

import * as React from 'react'
import { useRouter } from '@/lib/router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Briefcase, Loader2, Plus, Save, X } from 'lucide-react'
import { toast } from 'sonner'

import { get, post, patch } from '@/lib/api-client'
import { EMPLOYMENT_TYPES } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { ErrorState } from '@/components/spa/shared/EmptyState'
import { Spinner } from '@/components/spa/shared/Spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { label as humanize } from '@/components/spa/shared/formatters'
import { cn } from '@/lib/utils'

type Department = { id: string; name: string }

type LoadedJob = {
  id: string
  title: string
  description: string
  departmentId: string | null
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
}

const formSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(8000),
  departmentId: z.string().optional(),
  location: z.string().trim().min(2, 'Location is required').max(120),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  experienceMin: z.coerce.number().min(0, 'Cannot be negative').max(30).default(0),
  educationReq: z.string().trim().max(200).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(60)).max(15, 'At most 15 skills'),
  preferredSkills: z.array(z.string().trim().min(1).max(60)).max(15, 'At most 15 skills'),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  openings: z.coerce.number().int().min(1, 'At least 1 opening').max(100).default(1),
  status: z.enum(['DRAFT', 'OPEN']),
})

type FormValues = z.input<typeof formSchema>

/** Tag-chip input: type + Enter (or comma) to add, click ✕ to remove, max N items. */
function TagInput({
  value,
  onChange,
  placeholder,
  max = 15,
  tone,
  id,
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
  max?: number
  tone: 'violet' | 'slate'
  id: string
}) {
  const [draft, setDraft] = React.useState('')

  const commit = () => {
    const v = draft.trim()
    if (!v) return
    if (value.length >= max) {
      toast.error(`At most ${max} skills.`)
      return
    }
    if (value.some((s) => s.toLowerCase() === v.toLowerCase())) {
      toast.info(`“${v}” is already added.`)
      setDraft('')
      return
    }
    onChange([...value, v])
    setDraft('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              commit()
            }
          }}
          onBlur={commit}
          placeholder={value.length >= max ? `Max ${max} reached` : placeholder}
          disabled={value.length >= max}
          aria-label={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={commit}
          disabled={value.length >= max || !draft.trim()}
          aria-label="Add skill"
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label={`${placeholder} chips`}>
          {value.map((skill) => (
            <Badge
              key={skill}
              role="listitem"
              className={cn(
                'gap-1 pr-1',
                tone === 'violet' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {skill}
              <button
                type="button"
                onClick={() => onChange(value.filter((s) => s !== skill))}
                className="rounded-full p-0.5 hover:bg-foreground/10 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Remove ${skill}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Type a skill and press Enter to add it as a chip.</p>
      )}
      <p className="text-[11px] text-muted-foreground">
        {value.length}/{max}
      </p>
    </div>
  )
}

export function JobFormPage({ params }: { params: Record<string, string> }) {
  const isEdit = Boolean(params.id)
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      departmentId: 'NONE',
      location: '',
      employmentType: 'FULL_TIME',
      experienceMin: 0,
      educationReq: '',
      requiredSkills: [],
      preferredSkills: [],
      salaryMin: undefined,
      salaryMax: undefined,
      openings: 1,
      status: 'DRAFT',
    },
  })

  const [departments, setDepartments] = React.useState<Department[]>([])
  const [loadingJob, setLoadingJob] = React.useState(isEdit)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const requiredSkills = watch('requiredSkills') ?? []
  const preferredSkills = watch('preferredSkills') ?? []
  const departmentId = watch('departmentId')
  const employmentType = watch('employmentType')
  const jobStatus = watch('status')

  React.useEffect(() => {
    const loadDepts = async () => {
      try {
        const data = await get<{ items: Department[] } | Department[]>('/api/departments')
        setDepartments(Array.isArray(data) ? data : data.items)
      } catch {
        // department select is optional; leave empty
      }
    }
    void loadDepts()
  }, [])

  React.useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setLoadingJob(true)
      setLoadError(null)
      try {
        const job = await get<LoadedJob>(`/api/jobs/${params.id}`)
        reset({
          title: job.title,
          description: job.description,
          departmentId: job.departmentId ?? 'NONE',
          location: job.location,
          employmentType: (EMPLOYMENT_TYPES as readonly string[]).includes(job.employmentType)
            ? (job.employmentType as FormValues['employmentType'])
            : 'FULL_TIME',
          experienceMin: job.experienceMin ?? 0,
          educationReq: job.educationReq ?? '',
          requiredSkills: job.requiredSkills ?? [],
          preferredSkills: job.preferredSkills ?? [],
          salaryMin: job.salaryMin ?? undefined,
          salaryMax: job.salaryMax ?? undefined,
          openings: job.openings ?? 1,
          status: job.status === 'OPEN' ? 'OPEN' : 'DRAFT',
        })
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load the job')
      } finally {
        setLoadingJob(false)
      }
    }
    void load()
  }, [isEdit, params.id, reset])

  const onSubmit = async (values: FormValues) => {
    const parsed = formSchema.parse(values)
    const body = {
      ...parsed,
      departmentId: parsed.departmentId && parsed.departmentId !== 'NONE' ? parsed.departmentId : undefined,
      educationReq: parsed.educationReq || undefined,
      salaryMin: parsed.salaryMin ?? undefined,
      salaryMax: parsed.salaryMax ?? undefined,
    }
    try {
      if (isEdit) {
        await patch(`/api/jobs/${params.id}`, body)
        toast.success('Job updated.')
        router.navigate(`#/hr/jobs/${params.id}`)
      } else {
        const created = await post<{ id: string }>('/api/jobs', body)
        toast.success(body.status === 'OPEN' ? 'Job published — candidates can apply now.' : 'Job saved as draft.')
        router.navigate(`#/hr/jobs/${created.id}`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the job')
    }
  }

  if (loadingJob) {
    return (
      <div className="flex flex-col items-center gap-4 py-24" role="status" aria-live="polite">
        <Spinner className="size-7" />
        <p className="text-sm text-muted-foreground">Loading job…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title={isEdit ? 'Edit job' : 'Post a job'} />
        <ErrorState
          title="Could not load this job"
          message={loadError}
          onRetry={() => router.navigate(isEdit ? `#/hr/jobs/${params.id}/edit` : '#/hr/jobs/new', { replace: true })}
        />
      </div>
    )
  }

  const err = (msg: string | undefined) =>
    msg ? (
      <p role="alert" className="text-xs font-medium text-destructive">
        {msg}
      </p>
    ) : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit job' : 'Post a job'}
        description={
          isEdit
            ? 'Update the opening. Publishing a draft makes it visible to candidates immediately.'
            : 'Describe the role precisely — the AI screener matches candidate resumes against these requirements.'
        }
        actions={
          <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3" noValidate>
        {/* ---- Main column ---- */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="j-title">Job title *</Label>
                <Input id="j-title" placeholder="e.g. Senior Frontend Engineer" aria-invalid={!!errors.title} {...register('title')} />
                {err(errors.title?.message)}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="j-desc">Description *</Label>
                <Textarea
                  id="j-desc"
                  rows={8}
                  placeholder="Responsibilities, day-to-day work, team context, benefits… (min 20 characters)"
                  aria-invalid={!!errors.description}
                  {...register('description')}
                />
                <div className="flex items-center justify-between">
                  {err(errors.description?.message)}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {(watch('description') ?? '').length}/8000
                  </span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="j-loc">Location *</Label>
                  <Input id="j-loc" placeholder="e.g. Bengaluru" aria-invalid={!!errors.location} {...register('location')} />
                  {err(errors.location?.message)}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="j-type">Employment type *</Label>
                  <input type="hidden" {...register('employmentType')} />
                  <Select value={employmentType} onValueChange={(v) => setValue('employmentType', v as FormValues['employmentType'])}>
                    <SelectTrigger id="j-type" aria-label="Employment type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {humanize(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="j-exp">Min experience (years)</Label>
                  <Input id="j-exp" type="number" min={0} max={30} {...register('experienceMin')} />
                  {err(errors.experienceMin?.message)}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="j-smin">Salary min (₹/yr)</Label>
                  <Input id="j-smin" type="number" min={0} placeholder="e.g. 800000" {...register('salaryMin')} />
                  {err(errors.salaryMin?.message)}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="j-smax">Salary max (₹/yr)</Label>
                  <Input id="j-smax" type="number" min={0} placeholder="e.g. 1200000" {...register('salaryMax')} />
                  {err(errors.salaryMax?.message)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills for AI screening</CardTitle>
              <CardDescription>
                Required skills weigh heavily in the match score; preferred skills add signal. Evidence for each is
                extracted from the resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label>Required skills</Label>
                <TagInput
                  id="j-req-skills"
                  value={requiredSkills}
                  onChange={(next) => setValue('requiredSkills', next, { shouldValidate: true })}
                  placeholder="e.g. React — press Enter"
                  tone="violet"
                />
                {err(errors.requiredSkills?.message as string | undefined)}
              </div>
              <div className="grid gap-2">
                <Label>Preferred skills</Label>
                <TagInput
                  id="j-pref-skills"
                  value={preferredSkills}
                  onChange={(next) => setValue('preferredSkills', next, { shouldValidate: true })}
                  placeholder="e.g. Next.js — press Enter"
                  tone="slate"
                />
                {err(errors.preferredSkills?.message as string | undefined)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- Side column ---- */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="size-4 text-primary" aria-hidden="true" />
                Organization & visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="j-dept">Department</Label>
                <input type="hidden" {...register('departmentId')} />
                <Select value={departmentId ?? 'NONE'} onValueChange={(v) => setValue('departmentId', v)}>
                  <SelectTrigger id="j-dept" aria-label="Department">
                    <SelectValue placeholder="No department" />
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
              <div className="grid gap-2">
                <Label htmlFor="j-edu">Education requirement</Label>
                <Input id="j-edu" placeholder="e.g. B.Tech or equivalent" {...register('educationReq')} />
                {err(errors.educationReq?.message)}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="j-open">Openings</Label>
                <Input id="j-open" type="number" min={1} max={100} {...register('openings')} />
                {err(errors.openings?.message)}
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <RadioGroup
                  value={jobStatus}
                  onValueChange={(v) => setValue('status', v as FormValues['status'])}
                  className="gap-3"
                >
                  <div className="flex items-start gap-2 rounded-lg border p-3">
                    <RadioGroupItem value="DRAFT" id="st-draft" />
                    <div>
                      <Label htmlFor="st-draft" className="font-normal">
                        Save as draft
                      </Label>
                      <p className="text-xs text-muted-foreground">Only HR/Admin can see it. Publish later.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg border p-3">
                    <RadioGroupItem value="OPEN" id="st-open" />
                    <div>
                      <Label htmlFor="st-open" className="font-normal">
                        Publish now
                      </Label>
                      <p className="text-xs text-muted-foreground">Visible on the public job board immediately.</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full min-h-11 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create job'}
          </Button>
        </div>
      </form>
    </div>
  )
}
