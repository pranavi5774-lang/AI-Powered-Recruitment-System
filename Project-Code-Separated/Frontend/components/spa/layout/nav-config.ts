'use client'

// ============================================================
// Navigation configuration — single source of truth for the
// sidebar, the mobile drawer, topbar page titles and the view
// registry. Route entries for ALL authed areas are defined here.
// ============================================================

import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Briefcase,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  FileText,
  IdCard,
  LayoutDashboard,
  ScrollText,
  Settings,
  Target,
  UserRound,
  Users,
  UserRoundSearch,
} from 'lucide-react'
import type { Role } from '@/lib/store'

export type NavItem = {
  route: string // hash path without '#', e.g. '/hr/jobs'
  title: string
  icon: LucideIcon
  description?: string
}

export type NavSection = {
  area: string // 'admin' | 'hr' | 'portal' | 'employee'
  label: string
  roles: Role[] // roles allowed to see this section
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    area: 'admin',
    label: 'Administration',
    roles: ['ADMIN'],
    items: [
      { route: '/admin/dashboard', title: 'Dashboard', icon: LayoutDashboard, description: 'Platform-wide overview and health' },
      { route: '/admin/users', title: 'User Management', icon: Users, description: 'Accounts, roles and access' },
      { route: '/admin/reports', title: 'Reports', icon: BarChart3, description: 'Organization-wide reports and exports' },
      { route: '/admin/audit', title: 'Audit Logs', icon: ScrollText, description: 'Immutable trail of every action' },
      { route: '/admin/settings', title: 'Settings', icon: Settings, description: 'System settings and configuration' },
    ],
  },
  {
    area: 'hr',
    label: 'Recruitment & HR',
    roles: ['HR', 'ADMIN'],
    items: [
      { route: '/hr/dashboard', title: 'Dashboard', icon: LayoutDashboard, description: 'Pipeline, hiring activity and attendance at a glance' },
      { route: '/hr/jobs', title: 'Jobs', icon: Briefcase, description: 'Post, publish and manage openings' },
      { route: '/hr/applications', title: 'Applications', icon: ClipboardList, description: 'Screen, track and move candidates through the pipeline' },
      { route: '/hr/employees', title: 'Employees', icon: IdCard, description: 'Employee records and onboarding' },
      { route: '/hr/attendance', title: 'Attendance', icon: CalendarCheck2, description: 'Daily attendance and monthly summaries' },
      { route: '/hr/leaves', title: 'Leave Approvals', icon: CalendarDays, description: 'Approve or reject leave requests' },
      { route: '/hr/performance', title: 'Performance', icon: Target, description: 'Periodic reviews and ratings' },
      { route: '/hr/reports', title: 'Reports', icon: BarChart3, description: 'Recruitment and workforce exports' },
    ],
  },
  {
    area: 'portal',
    label: 'Candidate Portal',
    roles: ['CANDIDATE'],
    items: [
      { route: '/portal/dashboard', title: 'Dashboard', icon: LayoutDashboard, description: 'Your application activity at a glance' },
      { route: '/portal/jobs', title: 'Browse Jobs', icon: UserRoundSearch, description: 'Find open roles that match your skills' },
      { route: '/portal/applications', title: 'My Applications', icon: FileText, description: 'Track status and interview schedules' },
      { route: '/portal/profile', title: 'My Profile', icon: UserRound, description: 'Resume, contact details and profile strength' },
    ],
  },
  {
    area: 'employee',
    label: 'Employee Portal',
    roles: ['EMPLOYEE'],
    items: [
      { route: '/employee/dashboard', title: 'Dashboard', icon: LayoutDashboard, description: 'Your day at HireSphere' },
      { route: '/employee/profile', title: 'My Profile', icon: UserRound, description: 'Personal and employment details' },
      { route: '/employee/attendance', title: 'Attendance', icon: CalendarCheck2, description: 'Your attendance history and hours' },
      { route: '/employee/leaves', title: 'Leave', icon: CalendarDays, description: 'Balances, requests and history' },
      { route: '/employee/performance', title: 'Performance', icon: Target, description: 'Reviews, goals and feedback' },
    ],
  },
]

/** Nav items visible to a given role. */
export function navForRole(role: Role): NavSection[] {
  return NAV_SECTIONS.filter((s) => s.roles.includes(role))
}

/** Find the nav item matching a hash path (exact, or as prefix). */
export function findNavItem(pathSegments: string[]): { item: NavItem; section: NavSection } | null {
  const joined = '/' + pathSegments.join('/')
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (joined === item.route || joined.startsWith(item.route + '/')) {
        return { item, section }
      }
    }
  }
  return null
}

/** Is `role` allowed to view the given top-level area? */
export function canAccessArea(role: Role, area: string): boolean {
  const section = NAV_SECTIONS.find((s) => s.area === area)
  return section ? section.roles.includes(role) : false
}
