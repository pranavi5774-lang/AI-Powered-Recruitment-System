'use client'

// ============================================================
// HeroCanvas — lazy, resilient mount for the 3D hero:
//   1. honors prefers-reduced-motion (renders CSS fallback),
//   2. mounts only when the hero enters the viewport,
//   3. next/dynamic with ssr:false + loading shimmer,
//   4. ErrorBoundary → beautiful static gradient/orb fallback.
// ============================================================

import * as React from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

const Hero3D = dynamic(() => import('./Hero3D'), {
  ssr: false,
  loading: () => <HeroFallback className="opacity-60" />,
})

/** Static CSS fallback: layered orbs + grid, matches the 3D mood. */
export function HeroFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/35 blur-3xl" />
      <div className="absolute top-1/3 left-1/4 size-40 rounded-full bg-[var(--info)]/20 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 size-52 rounded-full bg-[var(--chart-3)]/20 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(oklch(1 0 0 / 0.35) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.35) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 75%)',
        }}
      />
      <div className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[28%] border-2 border-primary/40" />
      <div className="absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-[30%] border border-[var(--info)]/40" />
    </div>
  )
}

/** Class error boundary around the WebGL canvas. */
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    // WebGL unsupported or context lost — the CSS fallback is enough.
  }

  render() {
    if (this.state.failed) return <HeroFallback />
    return this.props.children
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function useInView<T extends HTMLElement>(rootMargin = '160px') {
  const ref = React.useRef<T>(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          obs.disconnect()
        }
      },
      { rootMargin },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [inView, rootMargin])
  return { ref, inView }
}

export function HeroCanvas({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <div ref={ref} className={cn('relative h-full w-full', className)}>
      <HeroFallback />
      {!reduced && inView ? (
        <CanvasErrorBoundary>
          <div className="absolute inset-0">
            <Hero3D />
          </div>
        </CanvasErrorBoundary>
      ) : null}
    </div>
  )
}
