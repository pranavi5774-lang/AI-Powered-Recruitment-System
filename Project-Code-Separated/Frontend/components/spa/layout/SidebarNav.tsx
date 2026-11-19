'use client'

// ============================================================
// SidebarNav — desktop collapsible sidebar + mobile Sheet drawer.
// Renders the same nav sections from nav-config for both modes.
// ============================================================

import * as React from 'react'
import { ChevronsLeft, ChevronsRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Role } from '@/lib/store'
import { navForRole, type NavSection } from './nav-config'

type SidebarNavProps = {
  role: Role
  activePath: string
  collapsed: boolean
  onToggleCollapsed: () => void
  /** Mobile drawer */
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

function isActive(itemRoute: string, activePath: string): boolean {
  return activePath === itemRoute || activePath.startsWith(itemRoute + '/')
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <a href="#/" className="flex items-center gap-2.5 overflow-hidden" aria-label="HireSphere AI home">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.23_293)] to-[oklch(0.72_0.13_210)]">
        <Sparkles className="size-4.5 text-white" aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="truncate font-semibold tracking-tight">
          HireSphere <span className="text-gradient">AI</span>
        </span>
      )}
    </a>
  )
}

function NavLinks({
  sections,
  activePath,
  collapsed,
  onNavigate,
}: {
  sections: NavSection[]
  activePath: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scroll-slim" aria-label="Sections">
        {sections.map((section) => (
          <div key={section.area}>
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.label}
              </p>
            )}
            {collapsed && <div className="mx-auto mb-2 h-px w-6 bg-border" aria-hidden="true" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.route, activePath)
                const link = (
                  <a
                    href={`#${item.route}`}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors',
                      collapsed && 'justify-center px-0',
                      active
                        ? 'bg-primary/15 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <item.icon className={cn('size-4.5 shrink-0', active && 'text-primary')} aria-hidden="true" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </a>
                )
                return (
                  <li key={item.route}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </TooltipProvider>
  )
}

export function SidebarNav({
  role,
  activePath,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileOpenChange,
}: SidebarNavProps) {
  const sections = navForRole(role)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
        aria-label="Sidebar"
      >
        <div className={cn('flex h-16 items-center border-b px-4', collapsed && 'justify-center px-0')}>
          <Brand collapsed={collapsed} />
        </div>
        <NavLinks sections={sections} activePath={activePath} collapsed={collapsed} />
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
            className={cn('min-h-9 w-full gap-2 text-muted-foreground', collapsed && 'px-0')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile drawer — controlled from the Topbar button via mobileOpen */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetHeader className="h-16 justify-center border-b">
            <SheetTitle asChild>
              <div>
                <Brand />
              </div>
            </SheetTitle>
          </SheetHeader>
          <NavLinks
            sections={sections}
            activePath={activePath}
            collapsed={false}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
