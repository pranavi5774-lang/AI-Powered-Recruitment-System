// GET /api/attendance/summary?month=YYYY-MM — per-employee attendance counts
// HR/ADMIN: all employees (or ?employeeId=). EMPLOYEE: own row only.

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth, ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { monthRange } from '@/lib/datetime';

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const sp = req.nextUrl.searchParams;

  const monthParam = sp.get('month') ?? new Date().toISOString().slice(0, 7);
  let range: { start: Date; end: Date };
  try {
    range = monthRange(monthParam);
  } catch {
    throw new ApiError('INVALID_MONTH', 'month must be in YYYY-MM format', 400);
  }

  let employeeWhere: Record<string, unknown> = {};
  if (isStaff) {
    const employeeId = sp.get('employeeId');
    if (employeeId) employeeWhere = { id: employeeId };
  } else {
    const own = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
    employeeWhere = { id: own?.id ?? 'none' };
  }

  const employees = await db.employee.findMany({
    where: employeeWhere,
    select: { id: true, name: true, employeeCode: true },
    orderBy: { employeeCode: 'asc' },
  });

  const attendance = await db.attendance.findMany({
    where: { date: { gte: range.start, lt: range.end } },
    select: { employeeId: true, status: true },
  });

  const byEmployee = new Map<string, Map<string, number>>();
  for (const row of attendance) {
    let counts = byEmployee.get(row.employeeId);
    if (!counts) {
      counts = new Map();
      byEmployee.set(row.employeeId, counts);
    }
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }

  const items = employees.map((e) => {
    const counts = byEmployee.get(e.id);
    const get = (s: string) => counts?.get(s) ?? 0;
    const present = get('PRESENT');
    const absent = get('ABSENT');
    const late = get('LATE');
    const halfDay = get('HALF_DAY');
    const leave = get('LEAVE');
    const wfh = get('WFH');
    const holiday = get('HOLIDAY');
    return {
      employeeId: e.id,
      name: e.name,
      employeeCode: e.employeeCode,
      present,
      absent,
      late,
      halfDay,
      leave,
      wfh,
      holiday,
      total: present + absent + late + halfDay + leave + wfh + holiday,
    };
  });

  return ok({ month: monthParam, items });
});
