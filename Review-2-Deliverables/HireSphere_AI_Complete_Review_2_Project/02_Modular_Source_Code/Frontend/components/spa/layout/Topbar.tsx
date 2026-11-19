'use client'

// ============================================================
// Topbar — page title, notification bell (GET /api/notifications,
// unread badge, mark-read, mark-all-read — degrades gracefully
// when the API is not ready), user menu with logout, mobile nav
// button.
// ============================================================

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Bell, Check, CheckCheck, LogOut, Menu, BellOff, Palette, SunMoon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { get, patch } from '@/lib/api-client'
import { initialsOf, formatRelativeTime } from '@/components/spa/shared/formatters'
import type { AuthUser } from '@/lib/store'

type NotificationItem = {
  id: string
  title: string
  message: string
  type: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

type NotificationsPayload = {
  items?: NotificationItem[]
  unreadCount?: number
}

const MAX_NOTIFICATIONS = 30

export function Topbar({
  user,
  pageTitle,
  onOpenMobileNav,
  onLogout,
}: {
  user: AuthUser
  pageTitle: string
  onOpenMobileNav: () => void
  onLogout: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile nav */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">{pageTitle}</h2>
      </div>

      <NotificationBell />
      <UserMenu user={user} onLogout={onLogout} />
    </header>
  )
}

function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<NotificationItem[]>([])
  const [available, setAvailable] = React.useState(true) // API readiness

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await get<NotificationsPayload>('/api/notifications')
      setItems((data?.items ?? []).slice(0, MAX_NOTIFICATIONS))
      setAvailable(true)
    } catch {
      // API not ready (parallel build) or server hiccup — render empty state
      setAvailable(false)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const unread = items.filter((n) => !n.isRead).length

  const markRead = async (n: NotificationItem) => {
    if (!n.isRead) {
      // optimistic
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      try {
        await patch(`/api/notifications/${n.id}/read`)
      } catch {
        /* non-fatal */
      }
    }
    if (n.link?.startsWith('#')) {
      window.location.hash = n.link
      setOpen(false)
    }
  }

  const markAllRead = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
    try {
      await patch('/api/notifications/read-all')
    } catch {
      /* non-fatal */
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) void load() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-86 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between px-2 py-1.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={markAllRead}
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto scroll-slim" role="list">
          {loading ? (
            <div className="space-y-2 p-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <BellOff className="size-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {available ? 'You are all caught up.' : 'Notifications are not available yet.'}
              </p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                role="listitem"
                onClick={() => void markRead(n)}
                className={cn(
                  'block w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent',
                  !n.isRead && 'bg-primary/5',
                )}
              >
                <span className="flex items-center gap-2">
                  {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                  <span className="truncate text-sm font-medium">{n.title}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.message}</span>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { resolvedTheme, setTheme } = useTheme()
  const themeOptions = [
    { key: 'dark', label: 'Dark' },
    { key: 'light', label: 'Light' },
    { key: 'aurora', label: 'Aurora' },
    { key: 'sunset', label: 'Sunset' },
    { key: 'forest', label: 'Forest' },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="min-h-11 gap-2.5 px-2" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-32 truncate text-sm font-medium">{user.name}</span>
            <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px] font-semibold">
              {user.role}
            </Badge>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <Palette className="size-3.5" aria-hidden="true" />
            Theme
          </p>
          <div className="space-y-1">
            {themeOptions.map((theme) => {
              const isActive = (resolvedTheme ?? 'dark') === theme.key

              return (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => setTheme(theme.key)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                    isActive && 'bg-accent/80',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'size-2.5 rounded-full border border-current',
                        theme.key === 'dark' && 'bg-slate-950',
                        theme.key === 'light' && 'bg-slate-100',
                        theme.key === 'aurora' && 'bg-violet-400',
                        theme.key === 'sunset' && 'bg-orange-400',
                        theme.key === 'forest' && 'bg-emerald-500',
                      )}
                      aria-hidden="true"
                    />
                    {theme.label}
                  </span>
                  {isActive && <Check className="size-4" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme((resolvedTheme ?? 'dark') === 'dark' ? 'light' : 'dark')}
        >
          <SunMoon className="size-4" aria-hidden="true" />
          {resolvedTheme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
