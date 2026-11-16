// GET /api/dashboard/charts — aggregated series for the HR dashboard (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth } from '@/lib/api';
import { db } from '@/lib/db';
import { utcDateOnly, isoDate } from '@/lib/datetime';
import { LABELS } from '@/lib/constants';

const FUNNEL_STAGES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'HIRED'] as const;
const HR_RELEVANT_ENTITIES = ['JOB', 'APPLICATION', 'EMPLOYEE', 'LEAVE', 'PERFORMANCE', 'RESUME', 'ATTENDANCE'];

export const GET = handler(async (req) => {
  await requireAuth(req, ['HR', 'ADMIN']);

  const today = utcDateOnly();
  const since = new Date(today.getTime() - 13 * 86_400_000); // 14-day window

  const [statusCounts, appsSince, employees, attendanceToday, recentApplications, recentActivities] = await Promise.all([
    db.application.groupBy({ by: ['status'], _count: { _all: true } }),
    db.application.findMany({ where: { appliedAt: { gte: since } }, select: { appliedAt: true } }),
    db.employee.findMany({ select: { department: { select: { name: true } } } }),
    db.attendance.findMany({ where: { date: { gte: today, lt: new Date(today.getTime() + 86_400_000) } }, select: { status: true } }),
    db.application.findMany({
      orderBy: { appliedAt: 'desc' },
      take: 6,
      include: {
        candidate: { select: { user: { select: { name: true } } } },
        job: { select: { id: true, title: true } },
      },
    }),
    db.auditLog.findMany({
      where: { entityType: { in: HR_RELEVANT_ENTITIES } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  // ---- funnel ----
  const statusMap = new Map(statusCounts.map((s) => [s.status, s._count._all]));
  const funnel = FUNNEL_STAGES.map((stage) => ({
    stage,
    label: LABELS[stage] ?? stage,
    count: statusMap.get(stage) ?? 0,
  }));

  // ---- application trends (last 14 days, zero-filled) ----
  const trendMap = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    trendMap.set(isoDate(new Date(since.getTime() + i * 86_400_000)), 0);
  }
  for (const app of appsSince) {
    const key = isoDate(app.appliedAt);
    if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
  }
  const applicationTrends = Array.from(trendMap.entries()).map(([date, count]) => ({ date, count }));

  // ---- employees per department ----
  const deptMap = new Map<string, number>();
  for (const e of employees) {
    const name = e.department?.name ?? 'Unassigned';
    deptMap.set(name, (deptMap.get(name) ?? 0) + 1);
  }
  const departmentWise = Array.from(deptMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // ---- attendance overview for today ----
  const attMap = new Map<string, number>();
  for (const row of attendanceToday) {
    attMap.set(row.status, (attMap.get(row.status) ?? 0) + 1);
  }
  const attendanceOverview = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'WFH', 'HOLIDAY']
    .filter((s) => attMap.has(s))
    .map((status) => ({ status, label: LABELS[status] ?? status, count: attMap.get(status) ?? 0 }));

  return ok({
    funnel,
    applicationTrends,
    departmentWise,
    attendanceOverview,
    recentApplications: recentApplications.map((a) => ({
      id: a.id,
      candidateName: a.candidate.user.name,
      jobTitle: a.job.title,
      jobId: a.job.id,
      status: a.status,
      statusLabel: LABELS[a.status] ?? a.status,
      matchScore: a.matchScore,
      appliedAt: a.appliedAt,
    })),
    recentActivities: recentActivities.map((log) => ({
      id: log.id,
      actorName: log.actorName,
      actorRole: log.actorRole,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
    })),
  });
});
