'use client'

// ============================================================
// views-registry — maps hash route patterns to view components.
// ------------------------------------------------------------
// CONTRACT for later agents (API/data agents):
//  - Every authed view receives: { params, query }
//      params: dynamic segments, e.g. { id: 'abc' } for '/hr/jobs/:id'
//      query:  URLSearchParams of the hash query string
//  - To add/replace a view, edit ONLY the component file listed
//    here (paths below are the contract), or add a pattern.
//  - ':param' segments are supported by matchRoute().
//  - Order matters: more specific patterns first.
// ============================================================

import type { ComponentType } from 'react'
import { matchRoute } from '@/lib/router'
import type { RouteLocation } from '@/lib/router'

export type ViewProps = {
  params: Record<string, string>
  query: URLSearchParams
  location: RouteLocation
}

export type RouteEntry = {
  /** Pattern with optional ':param' segments, without '#'. */
  pattern: string
  component: ComponentType<ViewProps>
}

import { AdminDashboard } from '@/components/spa/admin/AdminDashboard'
import { UsersPage } from '@/components/spa/admin/UsersPage'
import { OrgReportsPage } from '@/components/spa/admin/OrgReportsPage'
import { AuditLogsPage } from '@/components/spa/admin/AuditLogsPage'
import { SettingsPage } from '@/components/spa/admin/SettingsPage'

import { HrDashboard } from '@/components/spa/hr/HrDashboard'
import { JobsPage } from '@/components/spa/hr/JobsPage'
import { JobFormPage } from '@/components/spa/hr/JobFormPage'
import { JobDetailPage } from '@/components/spa/hr/JobDetailPage'
import { ApplicationsPage } from '@/components/spa/hr/ApplicationsPage'
import { ApplicationDetailPage } from '@/components/spa/hr/ApplicationDetailPage'
import { CandidateRankingPage } from '@/components/spa/hr/CandidateRankingPage'
import { EmployeesPage } from '@/components/spa/hr/EmployeesPage'
import { EmployeeDetailPage } from '@/components/spa/hr/EmployeeDetailPage'
import { AttendancePage } from '@/components/spa/hr/AttendancePage'
import { LeavesPage } from '@/components/spa/hr/LeavesPage'
import { PerformancePage } from '@/components/spa/hr/PerformancePage'
import { ReportsPage } from '@/components/spa/hr/ReportsPage'

import { CandidateDashboard } from '@/components/spa/candidate/CandidateDashboard'
import { BrowseJobsPage } from '@/components/spa/candidate/BrowseJobsPage'
import { PublicJobDetailPage } from '@/components/spa/candidate/PublicJobDetailPage'
import { MyApplicationsPage } from '@/components/spa/candidate/MyApplicationsPage'
import { ProfilePage } from '@/components/spa/candidate/ProfilePage'

import { EmployeeDashboard } from '@/components/spa/employee/EmployeeDashboard'
import { MyProfilePage } from '@/components/spa/employee/MyProfilePage'
import { MyAttendancePage } from '@/components/spa/employee/MyAttendancePage'
import { MyLeavesPage } from '@/components/spa/employee/MyLeavesPage'
import { MyPerformancePage } from '@/components/spa/employee/MyPerformancePage'

export const AUTHED_ROUTES: RouteEntry[] = [
  // ---- ADMIN ----
  { pattern: '/admin/dashboard', component: AdminDashboard },
  { pattern: '/admin/users', component: UsersPage },
  { pattern: '/admin/reports', component: OrgReportsPage },
  { pattern: '/admin/audit', component: AuditLogsPage },
  { pattern: '/admin/settings', component: SettingsPage },

  // ---- HR ---- (more specific patterns first)
  { pattern: '/hr/dashboard', component: HrDashboard },
  { pattern: '/hr/jobs/new', component: JobFormPage },
  { pattern: '/hr/jobs/:id/edit', component: JobFormPage },
  { pattern: '/hr/jobs/:id/ranking', component: CandidateRankingPage },
  { pattern: '/hr/jobs/:id', component: JobDetailPage },
  { pattern: '/hr/jobs', component: JobsPage },
  { pattern: '/hr/applications/:id', component: ApplicationDetailPage },
  { pattern: '/hr/applications', component: ApplicationsPage },
  { pattern: '/hr/employees/:id', component: EmployeeDetailPage },
  { pattern: '/hr/employees', component: EmployeesPage },
  { pattern: '/hr/attendance', component: AttendancePage },
  { pattern: '/hr/leaves', component: LeavesPage },
  { pattern: '/hr/performance', component: PerformancePage },
  { pattern: '/hr/reports', component: ReportsPage },

  // ---- CANDIDATE ----
  { pattern: '/portal/dashboard', component: CandidateDashboard },
  { pattern: '/portal/jobs/:id', component: PublicJobDetailPage },
  { pattern: '/portal/jobs', component: BrowseJobsPage },
  { pattern: '/portal/applications', component: MyApplicationsPage },
  { pattern: '/portal/profile', component: ProfilePage },

  // ---- EMPLOYEE ----
  { pattern: '/employee/dashboard', component: EmployeeDashboard },
  { pattern: '/employee/profile', component: MyProfilePage },
  { pattern: '/employee/attendance', component: MyAttendancePage },
  { pattern: '/employee/leaves', component: MyLeavesPage },
  { pattern: '/employee/performance', component: MyPerformancePage },
]

/** Resolve the view for parsed router path segments, or null. */
export function resolveView(path: string[]): { entry: RouteEntry; params: Record<string, string> } | null {
  for (const entry of AUTHED_ROUTES) {
    const params = matchRoute(entry.pattern, path)
    if (params) return { entry, params }
  }
  return null
}
