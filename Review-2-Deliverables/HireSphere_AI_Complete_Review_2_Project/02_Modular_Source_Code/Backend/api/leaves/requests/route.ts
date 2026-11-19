// GET  /api/leaves/requests — leave requests (HR/ADMIN all; EMPLOYEE own)
// POST /api/leaves/requests — request leave (EMPLOYEE own; HR/ADMIN on behalf)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, getPagination, paginated, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { LEAVE_STATUSES } from '@/lib/constants';
import { parseFlexibleDate, utcDateOnly, inclusiveDays } from '@/lib/datetime';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SORT: Record<string, string> = { createdat: 'createdAt', startdate: 'startDate', enddate: 'endDate' };

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const p = getPagination(req);
  const sp = req.nextUrl.searchParams;

  const statusParam = sp.get('status');
  if (statusParam && !LEAVE_STATUSES.includes(statusParam as never)) {
    throw new ApiError('INVALID_STATUS', 'Invalid leave status filter', 400);
  }
  const employeeIdParam = sp.get('employeeId') ?? undefined;
  if (!isStaff && employeeIdParam) {
    throw new ApiError('FORBIDDEN', 'Employees can only view their own leave requests', 403);
  }

  let where: Record<string, unknown> = {
    ...(statusParam ? { status: statusParam } : {}),
    ...(isStaff && employeeIdParam ? { employeeId: employeeIdParam } : {}),
  };
  if (!isStaff) {
    const own = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
    where = { ...where, employeeId: own?.id ?? 'none' };
  }

  const [items, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      orderBy: { [SORT[p.sortBy.toLowerCase()] ?? 'createdAt']: p.sortDir },
      skip: p.skip,
      take: p.take,
      include: {
        employee: { select: { id: true, name: true, employeeCode: true } },
        leaveType: { select: { id: true, name: true } },
      },
    }),
    db.leaveRequest.count({ where }),
  ]);
  return ok(paginated(items, total, p));
});

const requestSchema = z.object({
  leaveTypeId: z.string().min(1, 'leaveTypeId is required'),
  startDate: z.string().regex(DATE_RE, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(DATE_RE, 'endDate must be YYYY-MM-DD'),
  reason: z.string().trim().min(3, 'Reason is required').max(1000),
  employeeId: z.string().min(1).optional(), // HR/ADMIN requesting on behalf
});

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['EMPLOYEE', 'HR', 'ADMIN']);
  const body = await parseBody(req, requestSchema);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';

  let employeeId: string;
  if (isStaff) {
    if (!body.employeeId) throw new ApiError('EMPLOYEE_ID_REQUIRED', 'employeeId is required when HR files a request on behalf of an employee', 400);
    employeeId = body.employeeId;
  } else {
    const own = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
    if (!own) throw new ApiError('EMPLOYEE_NOT_FOUND', 'No employee record is linked to this account', 404);
    employeeId = own.id;
  }

  const employee = await db.employee.findUnique({ where: { id: employeeId }, select: { id: true, name: true, userId: true } });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);

  const leaveType = await db.leaveType.findUnique({ where: { id: body.leaveTypeId } });
  if (!leaveType) throw new ApiError('LEAVE_TYPE_NOT_FOUND', 'Leave type not found', 404);

  const start = parseFlexibleDate(body.startDate);
  const end = parseFlexibleDate(body.endDate);
  if (end < start) throw new ApiError('INVALID_DATE_RANGE', 'endDate must be on or after startDate', 400);

  const today = utcDateOnly();
  if (!isStaff && (start < today || end < today)) {
    throw new ApiError('PAST_DATE', 'Leave dates must be today or in the future', 400);
  }

  const days = inclusiveDays(start, end);

  // Overlap guard against PENDING/APPROVED requests
  const overlap = await db.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { id: true },
  });
  if (overlap) throw new ApiError('LEAVE_OVERLAP', 'These dates overlap an existing pending or approved leave', 409);

  // Balance check: quota - used must cover the requested days
  const year = start.getUTCFullYear();
  const balance = await db.leaveBalance.findUnique({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: leaveType.id, year } },
  });
  const remaining = (balance?.quota ?? 0) - (balance?.used ?? 0);
  if (days > remaining) {
    throw new ApiError(
      'INSUFFICIENT_BALANCE',
      `Insufficient balance: ${days} day(s) requested but only ${remaining} remaining of ${leaveType.name}`,
      400
    );
  }

  const request = await db.leaveRequest.create({
    data: {
      employeeId,
      leaveTypeId: leaveType.id,
      startDate: start,
      endDate: end,
      days,
      reason: body.reason,
      status: 'PENDING',
    },
    include: {
      employee: { select: { id: true, name: true, employeeCode: true } },
      leaveType: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'LEAVE_REQUESTED',
    entityType: 'LEAVE',
    entityId: request.id,
    details: { employeeCode: employee.name, leaveType: leaveType.name, startDate: body.startDate, endDate: body.endDate, days },
    ip: clientIp(req),
  });
  return ok(request, 201);
});
