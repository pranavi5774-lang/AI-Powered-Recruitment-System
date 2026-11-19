'use client'

// ============================================================
// HireSphere AI — single-page application root.
// ------------------------------------------------------------
// The entire product renders at route `/` and navigates via the
// hash (see src/lib/router.ts):
//   Public:      #/                       Landing
//                #/login #/register
//                #/forgot-password
//                #/reset-password?token=…
//   Authed:      #/admin/*   (ADMIN)
//                #/hr/*      (HR | ADMIN)
//                #/portal/*  (CANDIDATE)
//                #/employee/*(EMPLOYEE)
//                #/dashboard → role dashboard redirect
// Wrong role or unknown route → redirect to the user's own
// dashboard; guests hitting protected views → #/login.
// ============================================================

import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { initRouter, useRouterStore } from '@/lib/router'
import { useAuthStore, ROLE_HOME } from '@/lib/store'
import { canAccessArea } from '@/components/spa/layout/nav-config'
import { resolveView } from '@/components/spa/views-registry'
import { DashboardShell } from '@/components/spa/layout/DashboardShell'
import { Landing } from '@/components/spa/landing/Landing'
import { Login } from '@/components/spa/auth/Login'
import { Register } from '@/components/spa/auth/Register'
import { ForgotPassword } from '@/components/spa/auth/ForgotPassword'
import { ResetPassword } from '@/components/spa/auth/ResetPassword'
import { ConfirmDialogHost } from '@/components/spa/shared/ConfirmDialog'
import { Spinner } from '@/components/spa/shared/Spinner'
import { EmptyState } from '@/components/spa/shared/EmptyState'
import { Button } from '@/components/ui/button'

const PUBLIC_SEGMENTS = new Set(['login', 'register', 'forgot-password', 'reset-password'])

function Splash({ label = 'Loading HireSphere AI…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-2xl" aria-hidden="true" />
        <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.55_0.23_293)] to-[oklch(0.72_0.13_210)]">
          <Sparkles className="size-7 text-white" aria-hidden="true" />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <Spinner />
    </div>
  )
}

function Redirect({ to, replace = true }: { to: string; replace?: boolean }) {
  const navigate = useRouterStore((s) => s.navigate)
  React.useEffect(() => {
    navigate(to, { replace })
  }, [to, replace, navigate])
  return <Splash label="Redirecting…" />
}

export default function Home() {
  const path = useRouterStore((s) => s.path)
  const query = useRouterStore((s) => s.query)
  const hash = useRouterStore((s) => s.hash)
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  // hash router bootstrap + auth bootstrap
  React.useEffect(() => initRouter(), [])
  React.useEffect(() => {
    void fetchMe()
  }, [fetchMe])

  const first = path[0] ?? ''
  const isRoot = path.length === 0
  const isPublicAuth = PUBLIC_SEGMENTS.has(first) && path.length === 1

  if (status === 'loading') {
    return <Splash />
  }

  if (status === 'guest' || !user) {
    if (isRoot) return <Landing />
    if (first === 'reset-password' && path.length === 1) {
      return (
        <>
          <ResetPassword />
          <ConfirmDialogHost />
        </>
      )
    }
    if (first === 'login' && path.length === 1) {
      return (
        <>
          <Login />
          <ConfirmDialogHost />
        </>
      )
    }
    if (first === 'register' && path.length === 1) {
      return (
        <>
          <Register />
          <ConfirmDialogHost />
        </>
      )
    }
    if (first === 'forgot-password' && path.length === 1) {
      return (
        <>
          <ForgotPassword />
          <ConfirmDialogHost />
        </>
      )
    }
    // any other (protected or unknown) view as guest → sign in
    return <Redirect to="#/login" />
  }

  // ---- authenticated ----
  const roleHome = ROLE_HOME[user.role] ?? '#/portal/dashboard'

  if (isRoot || first === 'dashboard') {
    return <Redirect to={roleHome} />
  }
  if (isPublicAuth) {
    return <Redirect to={roleHome} />
  }

  if (canAccessArea(user.role, first)) {
    const resolved = resolveView(path)
    if (resolved) {
      const View = resolved.entry.component
      return (
        <>
          <DashboardShell user={user}>
            <View key={hash} params={resolved.params} query={query} location={{ path, query, hash }} />
          </DashboardShell>
          <ConfirmDialogHost />
        </>
      )
    }
    return (
      <>
        <DashboardShell user={user}>
          <EmptyState
            icon={Sparkles}
            title="Page not found"
            description={`No view is registered for #${['', ...path].join('/')}. Pick a section from the sidebar.`}
            action={
              <Button asChild size="sm" className="min-h-9">
                <a href={roleHome}>Back to dashboard</a>
              </Button>
            }
          />
        </DashboardShell>
        <ConfirmDialogHost />
      </>
    )
  }

  // wrong role for this area → their own dashboard
  return <Redirect to={roleHome} />
}
