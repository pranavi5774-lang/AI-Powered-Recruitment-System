'use client'

// ============================================================
// HR — Candidate Ranking for a job (side-by-side comparison).
// Data: GET /api/jobs/:id/ranking  → { job, total, items }
//        + GET /api/jobs/:id for the header meta.
// Sorting & filters are client-side over the full ranking set
// (the endpoint is non-paginated by contract): matchScore desc
// default; min-score slider, required-skill and status filters.
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, BarChart3, Download, FileText, Info, Trophy } from 'lucide-react'
import { toast } from 'sonner'

import { get } from '@/lib/api-client'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { PageHeader } from '@/components/spa/shared/PageHeader'
import { StatusBadge } from '@/components/spa/shared/StatusBadge'
import { ScoreBar } from '@/components/spa/shared/ScoreBar'
import { EmptyState, ErrorState } from '@/components/spa/shared/EmptyState'
import { SkeletonRows } from '@/components/spa/shared/Loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatPercent, label } from '@/components/spa/shared/formatters'
import { cn } from '@/lib/utils'

type RankItem = {
  applicationId: string
  candidateName: string
  candidateEmail: string
  status: string
  matchScore: number | null
  tfidfScore: number | null
  skillScore: number | null
  matchedSkills: { skill: string; alias?: string; evidence?: string; required?: boolean }[]
  missingSkills: string[]
  extraSkills: string[]
  experienceYears: number | null
  education: string | null
  resumeParseStatus: string
  appliedAt: string
  recommendation: string
  parameterScores: { key: string; score: number; weight: number; contribution: number }[]
  evaluationDate: string | null
}

type RankingResponse = {
  job: { id: string; title: string; requiredSkills: string[]; preferredSkills: string[] }
  total: number
  dashboard: {
    totalApplications: number
    evaluatedResumes: number
    strongMatches: number
    potentialMatches: number
    moderateMatches: number
    lowMatches: number
    averageScore: number
  }
  items: RankItem[]
}

type SortKey = 'matchScore' | 'candidateName' | 'status' | 'experienceYears' | 'matchedCount'

const SORTERS: Record<SortKey, (a: RankItem, b: RankItem) => number> = {
  matchScore: (a, b) => {
    const av = a.matchScore ?? -1
    const bv = b.matchScore ?? -1
    return bv - av // desc default
  },
  candidateName: (a, b) => a.candidateName.localeCompare(b.candidateName),
  status: (a, b) => a.status.localeCompare(b.status),
  experienceYears: (a, b) => (b.experienceYears ?? -1) - (a.experienceYears ?? -1),
  matchedCount: (a, b) => b.matchedSkills.length - a.matchedSkills.length,
}

function MiniSkills({
  items,
  tone,
  max = 3,
}: {
  items: (string | { skill: string })[]
  tone: 'violet' | 'destructive'
  max?: number
}) {
  const names = items.map((i) => (typeof i === 'string' ? i : i.skill))
  if (names.length === 0) return <span className="text-xs text-muted-foreground">—</span>
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <Badge
          key={s}
          className={cn(
            'px-1.5 py-0 text-[10px]',
            tone === 'violet' ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive',
          )}
        >
          {s}
        </Badge>
      ))}
      {rest > 0 ? <Badge className="px-1.5 py-0 text-[10px] bg-muted text-muted-foreground">+{rest}</Badge> : null}
    </div>
  )
}

export function CandidateRankingPage({ params }: { params: Record<string, string> }) {
  const [data, setData] = React.useState<RankingResponse | null>(null)
  const [jobMeta, setJobMeta] = React.useState<{ title: string; status: string; location: string } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [minScore, setMinScore] = React.useState(0)
  const [skillFilter, setSkillFilter] = React.useState<string[]>([])
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [recommendationFilter, setRecommendationFilter] = React.useState('ALL')
  const [sortKey, setSortKey] = React.useState<SortKey>('matchScore')
  const reduce = useReducedMotion()

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rank, job] = await Promise.all([
        get<RankingResponse>(`/api/jobs/${params.id}/ranking`),
        get<{ id: string; title: string; status: string; location: string }>(`/api/jobs/${params.id}`),
      ])
      setData(rank)
      setJobMeta(job)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load the ranking')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  React.useEffect(() => {
    void load()
  }, [load])

  const requiredSkills = data?.job.requiredSkills ?? []

  const filtered = React.useMemo(() => {
    let items = data?.items ?? []
    if (minScore > 0) items = items.filter((i) => (i.matchScore ?? 0) * 100 >= minScore)
    if (statusFilter !== 'ALL') items = items.filter((i) => i.status === statusFilter)
    if (recommendationFilter !== 'ALL') items = items.filter((i) => i.recommendation === recommendationFilter)
    if (skillFilter.length > 0) {
      items = items.filter((i) => skillFilter.every((s) => i.matchedSkills.some((m) => m.skill === s)))
    }
    return [...items].sort(SORTERS[sortKey])
  }, [data, minScore, statusFilter, recommendationFilter, skillFilter, sortKey])

  const onExport = async () => {
    try {
      const res = await fetch(`/api/reports/pipeline?format=csv`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(`Export failed (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hiresphere-pipeline-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Full pipeline CSV exported.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <SkeletonRows rows={2} />
        <div className="h-96 animate-pulse rounded-xl border bg-card" />
        <span className="sr-only">Loading ranking</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Candidate Ranking" />
        <ErrorState title="Could not load the ranking" message={error ?? 'Not found'} onRetry={() => void load()} />
      </div>
    )
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'matchScore', label: 'AI match score (high → low)' },
    { key: 'candidateName', label: 'Candidate name (A → Z)' },
    { key: 'experienceYears', label: 'Experience (high → low)' },
    { key: 'matchedCount', label: 'Matched skills (most → least)' },
    { key: 'status', label: 'Pipeline status (A → Z)' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ranking — ${data.job.title}`}
        description={jobMeta ? `${jobMeta.location} • Job status: ${label(jobMeta.status)} • ${data.total} candidates screened by AI` : `${data.total} candidates`}
        actions={
          <>
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => window.history.back()}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            <Button variant="outline" size="sm" className="min-h-9 gap-1.5" onClick={() => void onExport()}>
              <Download className="size-4" aria-hidden="true" />
              Export CSV
            </Button>
          </>
        }
      />

      {/* decision-support banner */}
      <div role="note" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
        <p>
          <span className="font-medium">Decision-support view.</span> Scores rank textual & skill overlap — they never
          auto-reject. Consider the whole candidate (portfolio, interview, context) before moving anyone in the pipeline.
        </p>
      </div>

      {/* filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total applications', data.dashboard.totalApplications],
          ['Evaluated resumes', data.dashboard.evaluatedResumes],
          ['Strong matches', data.dashboard.strongMatches],
          ['Potential matches', data.dashboard.potentialMatches],
          ['Moderate matches', data.dashboard.moderateMatches],
          ['Low matches', data.dashboard.lowMatches],
          ['Average score', `${Math.round(data.dashboard.averageScore * 100)}%`],
          ['Top-ranked candidate', filtered[0]?.candidateName ?? '—'],
        ].map(([title, value]) => (
          <Card key={String(title)}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="mt-1 truncate text-xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card>
          <CardContent className="grid gap-5 p-4 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">
            <div className="space-y-2">
              <Label className="text-xs">Min match score: {minScore}%</Label>
              <Slider
                value={[minScore]}
                onValueChange={(v) => setMinScore(v[0] ?? 0)}
                min={0}
                max={100}
                step={5}
                aria-label="Minimum match score filter"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Has required skill</Label>
              <Select
                value={skillFilter[0] ?? 'ANY'}
                onValueChange={(v) => setSkillFilter(v === 'ANY' ? [] : [v])}
              >
                <SelectTrigger size="sm" aria-label="Required skill filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="ANY">Any</SelectItem>
                  {requiredSkills.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pipeline status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" aria-label="Status filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {label(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">AI recommendation</Label>
              <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
                <SelectTrigger size="sm" aria-label="Recommendation filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All recommendations</SelectItem>
                  <SelectItem value="STRONG_MATCH">Strong Match</SelectItem>
                  <SelectItem value="POTENTIAL_MATCH">Potential Match</SelectItem>
                  <SelectItem value="MODERATE_MATCH">Moderate Match</SelectItem>
                  <SelectItem value="LOW_MATCH">Low Match</SelectItem>
                  <SelectItem value="UNEVALUATED">Not evaluated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sort by</Label>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger size="sm" aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ranking table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No candidates match these filters"
          description="Loosen the min-score slider or clear the skill/status filters."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead className="w-44">AI match</TableHead>
                  <TableHead className="hidden lg:table-cell">Skills</TableHead>
                  <TableHead className="hidden lg:table-cell">Education</TableHead>
                  <TableHead className="hidden lg:table-cell">Experience</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Exp.</TableHead>
                  <TableHead className="hidden md:table-cell">Matched (top 3)</TableHead>
                  <TableHead className="hidden md:table-cell">Missing (top 3)</TableHead>
                  <TableHead className="hidden xl:table-cell">Applied</TableHead>
                  <TableHead className="hidden xl:table-cell">Evaluated</TableHead>
                  <TableHead className="text-right">Screening</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, idx) => (
                  <TableRow
                    key={r.applicationId}
                    className={cn(
                      'cursor-pointer',
                      idx === 0 && sortKey === 'matchScore' && (r.matchScore ?? 0) > 0 && 'bg-primary/5',
                    )}
                    onClick={() => (window.location.hash = `#/hr/applications/${r.applicationId}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        ;(window.location.hash = `#/hr/applications/${r.applicationId}`)
                      }
                    }}
                    aria-label={`Open screening for ${r.candidateName}`}
                  >
                    <TableCell className="tabular-nums text-muted-foreground">
                      {idx === 0 && sortKey === 'matchScore' && (r.matchScore ?? 0) > 0 ? (
                        <Trophy className="size-4 text-[var(--warning)]" aria-label="Top ranked" />
                      ) : (
                        idx + 1
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{r.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{r.candidateEmail}</p>
                      {r.education ? (
                        <p className="mt-0.5 max-w-56 truncate text-[11px] text-muted-foreground">{r.education}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <ScoreBar value={r.matchScore} />
                      <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                        tf-idf {formatPercent(r.tfidfScore)} • skill {formatPercent(r.skillScore)}
                      </p>
                    </TableCell>
                    {(['requiredSkills', 'education', 'experience'] as const).map((key) => (
                      <TableCell key={key} className="hidden lg:table-cell">
                        {r.parameterScores.find((parameter) => parameter.key === key)
                          ? `${Math.round(r.parameterScores.find((parameter) => parameter.key === key)!.score)}%`
                          : '—'}
                      </TableCell>
                    ))}
                    <TableCell><Badge variant="outline">{r.recommendation === 'UNEVALUATED' ? 'Not evaluated' : label(r.recommendation)}</Badge></TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="hidden tabular-nums lg:table-cell">
                      {r.experienceYears !== null ? `${r.experienceYears} yr${r.experienceYears === 1 ? '' : 's'}` : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <MiniSkills items={r.matchedSkills} tone="violet" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <MiniSkills items={r.missingSkills} tone="destructive" />
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap xl:table-cell">
                      <span className="text-xs text-muted-foreground">{formatDate(r.appliedAt)}</span>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap xl:table-cell">
                      <span className="text-xs text-muted-foreground">{r.evaluationDate ? formatDate(r.evaluationDate) : '—'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open screening for ${r.candidateName}`}
                      >
                        <a href={`#/hr/applications/${r.applicationId}`}>
                          <FileText className="size-4" aria-hidden="true" />
                          Open
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BarChart3 className="size-3.5" aria-hidden="true" />
        Ranked on the full candidate set for this job (non-paginated endpoint). Click any row to open the full screening
        workspace with resume evidence — the resume PDF opens from there.
      </p>
    </div>
  )
}
