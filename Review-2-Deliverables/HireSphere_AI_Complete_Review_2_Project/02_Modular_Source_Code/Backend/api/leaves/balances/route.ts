// GET /api/leaves/balances — leave balances (EMPLOYEE own; HR/ADMIN ?employeeId=)

export const dynamic = 'force-dynamic';

import { ok, handler, requireAuth, ApiError } from '@/lib/api';
import { db } from '@/lib/db';

export const GET = handler(async (req) => {
  const session = await requireAuth(req, ['EMPLOYEE', 'HR', 'ADMIN']);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const sp = req.nextUrl.searchParams;

  let employeeId: string;
  if (isStaff) {
    const employeeIdParam = sp.get('employeeId');
    if (!employeeIdParam) {
      throw new ApiError('EMPLOYEE_ID_REQUIRED', 'employeeId query parameter is required', 400);
    }
    employeeId = employeeIdParam;
  } else {
    const own = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
    if (!own) throw new ApiError('EMPLOYEE_NOT_FOUND', 'No employee record is linked to this account', 404);
    employeeId = own.id;
  }

  const employee = await db.employee.findUnique({ where: { id: employeeId }, select: { id: true, name: true, employeeCode: true } });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);

  const yearParam = sp.get('year');
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();
  if (Number.isNaN(year) || year < 2000 || year > 2100) {
    throw new ApiError('INVALID_YEAR', 'year must be a valid 4-digit year', 400);
  }

  const balances = await db.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveType: { select: { id: true, name: true } } },
  });

  return ok({
    year,
    employee: { id: employee.id, name: employee.name, employeeCode: employee.employeeCode },
    items: balances.map((b) => ({
      id: b.id,
      leaveTypeId: b.leaveTypeId,
      leaveType: b.leaveType,
      year: b.year,
      quota: b.quota,
      used: b.used,
      remaining: Math.max(0, b.quota - b.used),
    })),
  });
});
