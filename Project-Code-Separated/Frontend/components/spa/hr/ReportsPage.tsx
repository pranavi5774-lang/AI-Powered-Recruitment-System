'use client'

// ============================================================
// HR — Reports (reuses the generic org ReportsView).
// Same API and shape as Admin → Organization Reports; the
// implementation lives in admin/OrgReportsPage.tsx so both
// sidebars share one data-driven report component.
// ============================================================

import { ReportsView } from '@/components/spa/admin/OrgReportsPage'

export function ReportsPage(_props: unknown) {
  return (
    <ReportsView
      title="Reports"
      description="Recruitment, pipeline, workforce, attendance, leave, performance and AI-screening exports. Filter by date, export as CSV or print."
    />
  )
}
