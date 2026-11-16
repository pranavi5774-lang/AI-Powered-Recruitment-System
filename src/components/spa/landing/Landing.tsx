'use client'

// ============================================================
// Landing — public marketing page at #/
// Sticky glass navbar, 3D hero (lazy + resilient), features,
// workflow, technology, impact, rich footer.
// ============================================================

import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Briefcase,
  CalendarCheck2,
  ChevronRight,
  ClipboardList,
  FileSearch,
  IdCard,
  Leaf,
  Menu,
  Radar,
  ScrollText,
  Sparkles,
  Target,
  UserRoundSearch,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { HeroCanvas } from './HeroCanvas'

const NAV_LINKS = [
  { label: 'Features', target: 'features' },
  { label: 'Workflow', target: 'workflow' },
  { label: 'Technology', target: 'technology' },
  { label: 'Impact', target: 'impact' },
]

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#/" className="flex items-center gap-2.5" aria-label="HireSphere AI home">
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.23_293)] to-[oklch(0.72_0.13_210)] shadow-lg shadow-primary/25">
        <Sparkles className="size-5 text-white" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight">
          HireSphere <span className="text-gradient">AI</span>
        </span>
      )}
    </a>
  )
}

function Navbar() {
  const [open, setOpen] = React.useState(false)
  return (
    <nav className="glass fixed inset-x-0 top-0 z-40 border-b" aria-label="Main navigation">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <button
              key={l.target}
              type="button"
              onClick={() => scrollToSection(l.target)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" className="min-h-9">
            <a href="#/login">Log in</a>
          </Button>
          <Button asChild className="min-h-9 bg-gradient-to-r from-[oklch(0.52_0.23_293)] to-[oklch(0.55_0.15_260)] text-white hover:opacity-90">
            <a href="#/register">
              Get Started
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.target}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setTimeout(() => scrollToSection(l.target), 150)
                  }}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-left text-sm hover:bg-accent"
                >
                  {l.label}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <Button asChild variant="outline" className="min-h-11">
                <a href="#/login">Log in</a>
              </Button>
              <Button asChild className="min-h-11 bg-gradient-to-r from-[oklch(0.52_0.23_293)] to-[oklch(0.55_0.15_260)] text-white hover:opacity-90">
                <a href="#/register">Get Started</a>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mx-auto max-w-2xl space-y-3 text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground sm:text-base">{description}</p> : null}
    </motion.div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: LucideIcon
  title: string
  description: string
  index: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.07, 0.35), ease: 'easeOut' }}
      className="card-hover-lift rounded-xl border bg-card p-6"
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="size-5.5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  )
}

function Hero() {
  const reduce = useReducedMotion()
  const fade = (delay: number) => ({
    initial: reduce ? undefined : { opacity: 0, y: 22 },
    animate: reduce ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: 'easeOut' as const },
  })

  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden pt-16" aria-label="Hero">
      {/* 3D canvas + fallback (absolute backdrop) */}
      <div className="absolute inset-0">
        <HeroCanvas />
      </div>
      {/* gradient blobs */}
      <div className="pointer-events-none absolute -top-32 right-0 size-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 size-80 rounded-full bg-[var(--info)]/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <motion.div {...fade(0)} className="mx-auto max-w-3xl text-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <Radar className="size-3.5 text-primary" aria-hidden="true" />
            Academic full-stack + AI project · Explainable resume matching
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            AI-Powered Recruitment &{' '}
            <span className="text-gradient">Employee Management</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            HireSphere AI scores every resume against the job with explainable TF-IDF +
            cosine-similarity matching — while HR keeps full control of the pipeline, from posting
            and interviews to attendance, leave and performance.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-11 w-full bg-gradient-to-r from-[oklch(0.52_0.23_293)] to-[oklch(0.55_0.15_260)] text-white hover:opacity-90 sm:w-auto">
              <a href="#/register">
                Get started free
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="glass min-h-11 w-full sm:w-auto">
              <a href="#/login">Log in</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          {...fade(0.25)}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
          role="list"
          aria-label="Platform overview"
        >
          {[
            { value: '2 suites', label: 'Recruitment + Employee lifecycle' },
            { value: '4 portals', label: 'Admin · HR · Candidate · Employee' },
            { value: 'Explainable AI', label: 'Every score shows its evidence' },
          ].map((s) => (
            <div key={s.value} role="listitem" className="glass rounded-xl px-4 py-3.5 text-center">
              <p className="text-sm font-semibold text-foreground">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

const RECRUITMENT_FEATURES = [
  {
    icon: Briefcase,
    title: 'Job posting management',
    description:
      'Create, publish, and close openings with departments, required skills, salary ranges and openings — drafts stay private until you publish.',
  },
  {
    icon: BrainCircuit,
    title: 'AI screening & ranking',
    description:
      'TF-IDF cosine similarity over the full resume corpus, blended with required-skill coverage. Ranked shortlists in one click, with matched and missing skills shown.',
  },
  {
    icon: ClipboardList,
    title: 'Pipeline & interviews',
    description:
      'Move applications through Applied → Shortlisted → Interview → Hired with enforced transitions, status history, HR notes and scheduled interviews.',
  },
  {
    icon: UserRoundSearch,
    title: 'Candidate portal',
    description:
      'Candidates upload one resume, browse open roles, apply in seconds and track every status change — the AI never auto-rejects anyone.',
  },
]

const EMPLOYEE_FEATURES = [
  {
    icon: IdCard,
    title: 'Employee records & onboarding',
    description:
      'One click converts a hired candidate into an employee with code, department, leave balances and their own portal login.',
  },
  {
    icon: CalendarCheck2,
    title: 'Attendance',
    description:
      'Daily attendance with check-in/out, work hours, monthly summaries and HR corrections — including WFH and half-day states.',
  },
  {
    icon: Leaf,
    title: 'Leave management',
    description:
      'Leave types with annual quotas, balance checks, overlap detection, and a clean HR approval queue with notify-on-decision.',
  },
  {
    icon: Target,
    title: 'Performance reviews',
    description:
      'Structured periodic reviews with ratings, goals, achievements and strengths — visible to each employee in their portal.',
  },
]

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6" aria-label="Features">
      <SectionHeading
        eyebrow="Features"
        title={<>Two suites, <span className="text-gradient">one platform</span></>}
        description="Everything from the first job post to the last performance review — with the AI doing the reading, not the deciding."
      />
      <div className="mt-10 space-y-8">
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Briefcase className="size-4 text-primary" aria-hidden="true" />
            Recruitment suite
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RECRUITMENT_FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="size-4 text-primary" aria-hidden="true" />
            Employee suite
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EMPLOYEE_FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const WORKFLOW_STEPS = [
  {
    icon: FileSearch,
    title: 'Post',
    description: 'HR publishes a job with required skills, experience and salary range.',
  },
  {
    icon: BrainCircuit,
    title: 'Analyze',
    description: 'Every resume is scored by TF-IDF similarity + skill coverage — with evidence.',
  },
  {
    icon: ClipboardList,
    title: 'Interview',
    description: 'HR shortlists, schedules interviews and tracks decisions with full history.',
  },
  {
    icon: BadgeCheck,
    title: 'Hire → Employee',
    description: 'One click converts the hire into an employee record with balances and portal access.',
  },
]

function Workflow() {
  const reduce = useReducedMotion()
  return (
    <section id="workflow" className="relative scroll-mt-20 border-y bg-card/30 py-20" aria-label="Workflow">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Workflow"
          title="From posting to onboarding in four steps"
          description="A deliberate, auditable pipeline — the AI ranks, humans decide."
        />
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: 'easeOut' }}
              className="relative rounded-xl border bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[oklch(0.52_0.23_293)] to-[oklch(0.72_0.13_210)] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <step.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              {i < WORKFLOW_STEPS.length - 1 && (
                <ArrowRight
                  className="absolute top-1/2 -right-4 hidden size-5 -translate-y-1/2 text-muted-foreground/50 lg:block"
                  aria-hidden="true"
                />
              )}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const TECH_CHIPS = [
  'Next.js 16 (App Router)',
  'TypeScript 5',
  'Prisma ORM + SQLite (MySQL-ready)',
  'TF-IDF + Cosine Similarity',
  'Skill-dictionary matching',
  'Recharts',
  'Three.js / react-three-fiber',
  'shadcn/ui + Tailwind CSS 4',
  'JWT auth (httpOnly cookies)',
  'Zustand',
]

const IMPACT_BULLETS = [
  {
    icon: BrainCircuit,
    title: 'Screening time drops, not candidate quality',
    description:
      'Resumes are ranked against the actual job text in seconds, so HR starts every day with the most relevant profiles on top — and can inspect exactly why each one ranked where it did.',
  },
  {
    icon: ScrollText,
    title: 'Decisions leave a trail',
    description:
      'Every status change, approval and export is written to an audit log with actor, role and IP. Defensible by design.',
  },
  {
    icon: BadgeCheck,
    title: 'Explainability over black boxes',
    description:
      'Scores are a documented TF-IDF + skill-coverage formula — no opaque model, no auto-rejection. HR sees matched skills, missing skills and the evidence snippets.',
  },
  {
    icon: Users,
    title: 'One system, whole lifecycle',
    description:
      'The moment someone is hired, their employee record, leave balances and portal exist — no copy-pasting between recruitment and HR tools.',
  },
]

function Impact() {
  return (
    <section id="impact" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6" aria-label="Impact">
      <SectionHeading
        eyebrow="Impact"
        title="What the system changes in practice"
        description="Honest, qualitative outcomes — measured by how the workflow feels, not invented percentages."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {IMPACT_BULLETS.map((b, i) => (
          <FeatureCard key={b.title} {...b} index={i} />
        ))}
      </div>
    </section>
  )
}

function Technology() {
  return (
    <section id="technology" className="relative scroll-mt-20 border-y bg-card/30 py-20" aria-label="Technology">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Technology"
          title={<>Built on a modern, <span className="text-gradient">transparent</span> stack</>}
          description="A single TypeScript codebase end to end — and an AI layer you can read like documentation."
        />
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
          {TECH_CHIPS.map((chip, i) => (
            <motion.span
              key={chip}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="glass rounded-full px-4 py-2 text-sm text-foreground/90"
            >
              {chip}
            </motion.span>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          The matching engine is scikit-learn-compatible TF-IDF with L2-normalized vectors, blended
          with a required-skill coverage ratio — every number on screen can be recomputed and verified.
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-sidebar/60" aria-label="Footer">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm leading-relaxed text-muted-foreground">
              AI-powered recruitment and employee management — explainable matching, a controlled
              pipeline and a complete HR back office.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            <div>
              <p className="text-sm font-semibold">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {NAV_LINKS.map((l) => (
                  <li key={l.target}>
                    <button type="button" onClick={() => scrollToSection(l.target)} className="hover:text-foreground">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Get started</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#/register" className="hover:text-foreground">
                    Create account
                  </a>
                </li>
                <li>
                  <a href="#/login" className="hover:text-foreground">
                    Log in
                  </a>
                </li>
                <li>
                  <a href="#/portal/jobs" className="hover:text-foreground">
                    Browse jobs
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} HireSphere AI. All rights reserved.</p>
          <p>Built as an academic full-stack + AI project.</p>
        </div>
      </div>
    </footer>
  )
}

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Workflow />
        <Technology />
        <Impact />
      </main>
      <footer className="mt-auto">
        <Footer />
      </footer>
    </div>
  )
}
