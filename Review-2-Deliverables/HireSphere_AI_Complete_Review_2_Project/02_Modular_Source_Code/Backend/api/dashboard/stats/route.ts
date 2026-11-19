// GET /api/dashboard/stats — headline recruitment + workforce metrics (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth } from '@/lib/api';
import { db } from '@/lib/db';

export const GET = handler(async (req) => {
  await requireAuth(req, ['HR', 'ADMIN']);

  const now = new Date();
  const [
    totalEmployees,
    activeJobs,
    totalCandidates,
    totalApplications,
    shortlisted,
    interviewsScheduled,
    hired,
    pendingLeaves,
  ] = await Promise.all([
    db.employee.count(),
    db.job.count({ where: { status: 'OPEN' } }),
    db.user.count({ where: { role: 'CANDIDATE' } }),
    db.application.count(),
    db.application.count({ where: { status: 'SHORTLISTED' } }),
    db.interview.count({ where: { status: 'SCHEDULED', scheduledAt: { gte: now } } }),
    db.application.count({ where: { status: 'HIRED' } }),
    db.leaveRequest.count({ where: { status: 'PENDING' } }),
  ]);

  return ok({
    totalEmployees,
    activeJobs,
    totalCandidates,
    totalApplications,
    shortlisted,
    interviewsScheduled,
    hired,
    pendingLeaves,
    generatedAt: now.toISOString(),
  });
});
