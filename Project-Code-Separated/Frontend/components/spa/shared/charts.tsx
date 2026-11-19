'use client'

// ============================================================
// charts.tsx — shared recharts wrappers (violet/cyan product palette).
// All charts: ResponsiveContainer, entrance animation, dark-grid styling,
// consistent tooltips. Used by dashboard/report views of later agents.
//
// Import from: '@/components/spa/shared/charts'
// ============================================================

import { useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const GRID_STROKE = 'oklch(1 0 0 / 0.08)'
const AXIS_STYLE = { fontSize: 11, fill: 'var(--muted-foreground)' } as const

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--popover-foreground)',
  fontSize: 12,
  boxShadow: '0 10px 30px -10px oklch(0 0 0 / 0.5)',
}

export type FunnelDatum = { stage: string; label: string; count: number }
export type TrendDatum = { date: string; count: number }
export type SliceDatum = { name: string; count: number }
export type AttendanceDatum = { status: string; label: string; count: number }
export type ScatterDatum = { tfidf: number; skill: number; final: number; candidate: string }

function ChartShell({
  title,
  children,
  height = 280,
}: {
  title?: string
  children: React.ReactNode
  height?: number
}) {
  return (
    <div className="w-full" style={{ height }}>
      {title ? <p className="mb-3 text-sm font-medium">{title}</p> : null}
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

/** Horizontal bars sorted by count — recruitment pipeline APPLIED → HIRED. */
export function FunnelChart({
  data,
  title = 'Recruitment pipeline',
  height,
}: {
  data: FunnelDatum[]
  title?: string
  height?: number
}) {
  const reduce = useReducedMotion()
  const sorted = useMemo(() => [...data].sort((a, b) => b.count - a.count), [data])
  return (
    <ChartShell title={title} height={height}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="hs-funnel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-2)" />
          </linearGradient>
        </defs>
        <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
        <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="label" width={110} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: GRID_STROKE }} contentStyle={TOOLTIP_STYLE} />
        <Bar
          dataKey="count"
          name="Candidates"
          fill="url(#hs-funnel)"
          radius={[0, 8, 8, 0]}
          barSize={22}
          animationDuration={reduce ? 0 : 700}
        />
      </BarChart>
    </ChartShell>
  )
}

/** Area chart with violet gradient — applications per day. */
export function TrendAreaChart({
  data,
  title = 'Application trends',
  height,
  valueName = 'Applications',
}: {
  data: TrendDatum[]
  title?: string
  height?: number
  valueName?: string
}) {
  const reduce = useReducedMotion()
  return (
    <ChartShell title={title} height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="hs-trend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="date" tick={AXIS_STYLE} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey="count"
          name={valueName}
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#hs-trend)"
          animationDuration={reduce ? 0 : 700}
        />
      </AreaChart>
    </ChartShell>
  )
}

/** Donut pie — employees per department. */
export function DepartmentPieChart({
  data,
  title = 'Department distribution',
  height,
}: {
  data: SliceDatum[]
  title?: string
  height?: number
}) {
  const reduce = useReducedMotion()
  return (
    <ChartShell title={title} height={height}>
      <PieChart>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          innerRadius="55%"
          outerRadius="82%"
          paddingAngle={3}
          strokeWidth={0}
          animationDuration={reduce ? 0 : 700}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartShell>
  )
}

/** Vertical bars — today's attendance overview. */
export function AttendanceBarChart({
  data,
  title = "Today's attendance",
  height,
}: {
  data: AttendanceDatum[]
  title?: string
  height?: number
}) {
  const reduce = useReducedMotion()
  return (
    <ChartShell title={title} height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: GRID_STROKE }} contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="count" name="Employees" radius={[8, 8, 0, 0]} barSize={28} animationDuration={reduce ? 0 : 700}>
          {data.map((entry, i) => (
            <Cell key={entry.status} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartShell>
  )
}

/** Scatter — TF-IDF vs skill score, bubble size/color by final score. */
export function ScoreScatterChart({
  data,
  title = 'AI score landscape',
  height,
}: {
  data: ScatterDatum[]
  title?: string
  height?: number
}) {
  return (
    <ChartShell title={title} height={height}>
      <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
        <CartesianGrid stroke={GRID_STROKE} />
        <XAxis
          type="number"
          dataKey="tfidf"
          name="TF-IDF"
          domain={[0, 1]}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="skill"
          name="Skill"
          domain={[0, 1]}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
        />
        <ZAxis type="number" dataKey="final" range={[40, 240]} name="Final score" />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill="var(--chart-1)" fillOpacity={0.65} stroke="var(--chart-2)" />
      </ScatterChart>
    </ChartShell>
  )
}
