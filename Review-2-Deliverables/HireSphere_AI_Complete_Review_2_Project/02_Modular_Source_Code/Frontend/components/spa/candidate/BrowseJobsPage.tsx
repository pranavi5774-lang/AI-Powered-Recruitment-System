'use client'

// ============================================================
// Browse Jobs — public open-positions catalog for candidates.
// Data: GET /api/jobs (OPEN only, server-side search + filters),
// GET /api/departments for the department filter.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building2,
  MapPin,
  SearchX,
  Timer,
} from 'lucide-react'
import { get, type Paginated } from '@/lib/api-client'
import { useRouter } from '@/lib/router'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { SearchInput } from '@/components/spa/shared/SearchInput'
import { Pagination } from '@/components/spa/shared/Pagination'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  formatRelativeTime,
  formatSalaryRange,
  label as formatLabel,
} from '@/components/spa/shared/formatters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EMPLOYMENT_TYPES } from '@/lib/constants'

type Job = {
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
  _count: { applications: number }
}

type Department = { id: string; name: string }

const PAGE_SIZE = 9

export function BrowseJobsPage() {
  const router = useRouter()
  const reduce = useReducedMotion()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [location, setLocation] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [page, setPage] = useState(1)

  const [jobs, setJobs] = useState<Paginated<Job> | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // debounce the free-text search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    get<Paginated<Department>>('/api/departments?pageSize=100')
      .then((d) => {
        if (!cancelled) setDepartments(d.items)
      })
      .catch(() => {
        // department filter is optional — silently degrade
      })
    return () => {
      cancelled = true
    }
  }, [])

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sortBy: 'publishedAt',
      sortDir: 'desc',
    })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (location.trim()) params.set('location', location.trim())
    if (employmentType) params.set('employmentType', employmentType)
    if (departmentId) params.set('departmentId', departmentId)
    return params.toString()
  }, [page, debouncedSearch, location, employmentType, departmentId])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await get<Paginated<Job>>(`/api/jobs?${queryString}`)
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    void load()
  }, [load])

  const hasActiveFilters = Boolean(debouncedSearch || location.trim() || employmentType || departmentId)

  const resetFilters = () => {
    setSearch('')
    setLocation('')
    setEmploymentType('')
    setDepartmentId('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse Jobs"
        description="Open roles matched against your resume by the AI screening engine."
      />

      {/* Filters */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search title or skills…"
            ariaLabel="Search jobs by title or skill"
            className="lg:col-span-1 sm:max-w-none"
          />
          <Input
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value)
              setPage(1)
            }}
            placeholder="Location (e.g. Bengaluru)"
            aria-label="Filter by location"
            className="h-9"
          />
          <Select
            value={employmentType || 'all'}
            onValueChange={(v) => {
              setEmploymentType(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-full" aria-label="Filter by employment type">
              <SelectValue placeholder="Employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {EMPLOYMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {formatLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={departmentId || 'all'}
            onValueChange={(v) => {
              setDepartmentId(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-full" aria-label="Filter by department">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <JobGridSkeleton />
      ) : !jobs || jobs.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={hasActiveFilters ? 'No jobs match your filters' : 'No open positions right now'}
          description={
            hasActiveFilters
              ? 'Try a different keyword, clear a filter or check back soon — new roles are posted regularly.'
              : 'New roles are posted regularly. Check back soon or complete your profile so recruiters can find you.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={resetFilters} className="min-h-11">
                Clear all filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.items.map((job, i) => (
              <JobCard key={job.id} job={job} index={i} reduce={!!reduce} onOpen={() => router.navigate(`#/portal/jobs/${job.id}`)} />
            ))}
          </div>
          <Pagination
            page={jobs.page}
            totalPages={jobs.totalPages}
            total={jobs.total}
            pageSize={jobs.pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}

function JobCard({
  job,
  index,
  reduce,
  onOpen,
}: {
  job: Job
  index: number
  reduce: boolean
  onOpen: () => void
}) {
  const skills = job.requiredSkills ?? []
  const shown = skills.slice(0, 5)
  const extra = skills.length - shown.length

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, delay: reduce ? 0 : Math.min(index * 0.05, 0.25), ease: 'easeOut' }}
    >
      <Card className="card-hover-lift flex h-full flex-col transition-shadow">
        <CardContent className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="text-left text-base font-semibold leading-snug hover:text-primary hover:underline sm:text-lg"
              aria-label={`View details for ${job.title}`}
            >
              {job.title}
            </button>
            {job.department ? (
              <Badge variant="secondary" className="shrink-0 gap-1">
                <Building2 className="size-3" aria-hidden="true" />
                {job.department.name}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3.5" aria-hidden="true" />
              {formatLabel(job.employmentType)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Timer className="size-3.5" aria-hidden="true" />
              {job.publishedAt ? formatRelativeTime(job.publishedAt) : 'New'}
            </span>
            {job.salaryMin || job.salaryMax ? (
              <span className="inline-flex items-center gap-1">
                <Banknote className="size-3.5" aria-hidden="true" />
                {formatSalaryRange(job.salaryMin, job.salaryMax)}
              </span>
            ) : null}
          </div>

          {shown.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Required skills">
              {shown.map((s) => (
                <Badge key={s} variant="outline" className="font-normal">
                  {s}
                </Badge>
              ))}
              {extra > 0 ? (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  +{extra} more
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {job.experienceMin ? `${job.experienceMin}+ yrs exp` : 'Entry level'}
              {job.openings ? ` · ${job.openings} opening${job.openings > 1 ? 's' : ''}` : ''}
            </span>
            <Button size="sm" className="min-h-11 gap-1.5 px-4" onClick={onOpen} aria-label={`Apply to ${job.title}`}>
              Apply
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function JobGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex justify-between pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}
