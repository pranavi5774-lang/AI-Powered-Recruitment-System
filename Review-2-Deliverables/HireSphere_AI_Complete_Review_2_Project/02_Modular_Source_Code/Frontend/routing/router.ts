'use client'

// ============================================================
// HireSphere AI — hash-based router (single-SPA constraint)
// ------------------------------------------------------------
// The whole product lives at route `/`. Navigation happens via
// location.hash, e.g. `#/hr/jobs`, `#/hr/jobs/:id?tab=ranking`.
//
// Usage:
//   const { path, query, hash, navigate } = useRouter()
//   navigate('#/hr/jobs')
//
// `path` is the array of hash-path segments: '#/hr/jobs/abc'
//   -> ['hr', 'jobs', 'abc']
// `query` is a URLSearchParams of the hash query string.
// ============================================================

import { useEffect, useMemo } from 'react'
import { create } from 'zustand'

export type RouteLocation = {
  path: string[]
  query: URLSearchParams
  hash: string
}

type RouterStore = RouteLocation & {
  /** Sync internal state from window.location.hash. */
  _sync: () => void
  /** Navigate to a hash target like '#/hr/jobs'. */
  navigate: (to: string, opts?: { replace?: boolean }) => void
}

function parseHash(raw: string): { path: string[]; query: URLSearchParams; hash: string } {
  let hashPart = raw || '#/'
  if (!hashPart.startsWith('#')) hashPart = '#' + hashPart
  const withoutHash = hashPart.slice(1) || '/'
  const [pathPart, queryPart = ''] = withoutHash.split('?')
  const segments = pathPart
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
  return {
    path: segments,
    query: new URLSearchParams(queryPart),
    hash: hashPart,
  }
}

export const useRouterStore = create<RouterStore>((set, get) => ({
  ...parseHash('#/'),
  _sync: () => {
    if (typeof window === 'undefined') return
    set(parseHash(window.location.hash))
  },
  navigate: (to, opts) => {
    if (typeof window === 'undefined') return
    const target = to.startsWith('#') ? to : `#${to.startsWith('/') ? to : '/' + to}`
    if (opts?.replace) {
      window.history.replaceState(null, '', target)
      get()._sync()
    } else if (window.location.hash === target) {
      // same hash → hashchange won't fire; force sync (e.g. query-only refresh)
      get()._sync()
    } else {
      window.location.hash = target // triggers hashchange → _sync
    }
  },
}))

/** Reactive router state. Mount <RouterSync /> (or call initRouter) once at the app root. */
export function useRouter(): RouteLocation & { navigate: RouterStore['navigate'] } {
  const path = useRouterStore((s) => s.path)
  const query = useRouterStore((s) => s.query)
  const hash = useRouterStore((s) => s.hash)
  const navigate = useRouterStore((s) => s.navigate)
  return useMemo(() => ({ path, query, hash, navigate }), [path, query, hash, navigate])
}

/** Convenience hook: current hash path as a string, e.g. '/hr/jobs'. */
export function useRoutePath(): string {
  return useRouterStore((s) => s.path).join('/')
}

/**
 * Match a pattern like '/hr/jobs/:id/ranking' against parsed segments.
 * Returns params map (e.g. { id: 'abc' }) or null when it doesn't match.
 */
export function matchRoute(
  pattern: string,
  segments: string[],
): Record<string, string> | null {
  const pat = pattern.replace(/^#/, '').split('/').filter(Boolean)
  if (pat.length !== segments.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < pat.length; i++) {
    const p = pat[i]
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(segments[i])
    } else if (p !== segments[i]) {
      return null
    }
  }
  return params
}

/** Join current segments back into a canonical path string. */
export function segmentsToPath(segments: string[]): string {
  return '/' + segments.join('/')
}

/**
 * Attach the hashchange listener + initial sync. Call once from the root
 * component; returns a cleanup function.
 */
export function initRouter(): () => void {
  if (typeof window === 'undefined') return () => {}
  const onChange = () => useRouterStore.getState()._sync()
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)

  const handleClick = (e: MouseEvent) => {
    // Only handle left clicks without modifier keys
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    const target = (e.target as HTMLElement).closest('a')
    if (!target) return
    const href = target.getAttribute('href')
    if (href && href.startsWith('#')) {
      e.preventDefault()
      useRouterStore.getState().navigate(href)
    }
  }
  document.addEventListener('click', handleClick)

  useRouterStore.getState()._sync()
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
    document.removeEventListener('click', handleClick)
  }
}
