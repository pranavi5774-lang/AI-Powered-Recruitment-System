'use client'

// ============================================================
// DashboardShell — authed app frame.
//   [sidebar | topbar · main(view) · footer]
// Root wrapper is `min-h-screen flex flex-col`; the footer uses
// `mt-auto` so it sticks to the bottom on short views and is
// pushed down naturally on long ones.
// ============================================================

import * as React from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarNav } from './SidebarNav'
import { Topbar } from './Topbar'
import { findNavItem } from './nav-config'
import { useRouterStore, segmentsToPath } from '@/lib/router'
import { useAuthStore, type AuthUser } from '@/lib/store'

export function DashboardShell({
  user,
  children,
}: {
  user: AuthUser
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const path = useRouterStore((s) => s.path)
  const navigate = useRouterStore((s) => s.navigate)
  const logout = useAuthStore((s) => s.logout)

  const activePath = segmentsToPath(path)
  const match = findNavItem(path)
  const pageTitle = match?.item.title ?? 'Dashboard'

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out. See you soon!')
    navigate('#/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SidebarNav
        role={user.role}
        activePath={activePath}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="flex min-h-screen flex-1 flex-col md:min-h-screen">
        <Topbar
          user={user}
          pageTitle={pageTitle}
          onOpenMobileNav={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8" id="main-content">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <footer
          className={cn(
            'mt-auto border-t px-4 py-3 text-center text-xs text-muted-foreground sm:px-6',
          )}
          aria-label="Application footer"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" aria-hidden="true" />
            HireSphere AI • Academic project — AI-assisted recruitment & HR, explainable by design
          </span>
        </footer>
      </div>
    </div>
  )
}
