// GET /api/dashboard/employee — employee self-service home metrics (EMPLOYEE only)

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth, ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { utcDateOnly, monthRange } from '@/lib/datetime';

export const GET = handler(async (req) => {
  const session = await requireAuth(req, ['EMPLOYEE']);

  const employee = await db.employee.findUnique({ where: { userId: session.sub } });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'No employee record is linked to this account', 404);

  const today = utcDateOnly();
  const { start: monthStart, end: monthEnd } = monthRange(new Date().toISOString().slice(0, 7));

  const [profile, todayAttendance, monthlyPresent, pendingLeaves, latestReview, leaveBalances] = await Promise.all([
    db.employee.findUnique({
      where: { id: employee.id },
      include: { department: { select: { id: true, name: true } } },
    }),
    db.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    }),
    db.attendance.count({
      where: { employeeId: employee.id, date: { gte: monthStart, lt: monthEnd }, status: { in: ['PRESENT', 'WFH'] } },
    }),
    db.leaveRequest.count({ where: { employeeId: employee.id, status: 'PENDING' } }),
    db.performanceReview.findFirst({
      where: { employeeId: employee.id },
      orderBy: { reviewDate: 'desc' },
      select: { id: true, period: true, rating: true, reviewDate: true, feedback: true },
    }),
    db.leaveBalance.findMany({
      where: { employeeId: employee.id, year: new Date().getUTCFullYear() },
      include: { leaveType: { select: { id: true, name: true } } },
    }),
  ]);

  return ok({
    profile,
    todayAttendance,
    monthlyPresent,
    pendingLeaves,
    latestReview,
    leaveBalances: leaveBalances.map((b) => ({
      id: b.id,
      leaveType: b.leaveType,
      year: b.year,
      quota: b.quota,
      used: b.used,
      remaining: Math.max(0, b.quota - b.used),
    })),
    today: today.toISOString().slice(0, 10),
  });
});
