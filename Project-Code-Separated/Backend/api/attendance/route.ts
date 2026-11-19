// GET  /api/attendance — attendance records (HR/ADMIN any; EMPLOYEE own only)
// POST /api/attendance — record attendance (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, getPagination, paginated, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { ATTENDANCE_STATUSES } from '@/lib/constants';
import { monthRange, utcDateOnly, combineDateTime } from '@/lib/datetime';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SORT: Record<string, string> = { date: 'date', createdat: 'createdAt', updatedat: 'updatedAt' };

async function resolveEmployeeId(session: { role: string; sub: string }): Promise<string | null> {
  const employee = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
  return employee?.id ?? null;
}

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const p = getPagination(req);
  const sp = req.nextUrl.searchParams;

  const employeeId = sp.get('employeeId') ?? undefined;
  if (!isStaff && employeeId) {
    throw new ApiError('FORBIDDEN', 'Employees can only view their own attendance', 403);
  }
  const monthParam = sp.get('month');
  let monthWhere: Record<string, unknown> = {};
  if (monthParam) {
    try {
      const { start, end } = monthRange(monthParam);
      monthWhere = { date: { gte: start, lt: end } };
    } catch {
      throw new ApiError('INVALID_MONTH', 'month must be in YYYY-MM format', 400);
    }
  }

  let where: Record<string, unknown> = { ...monthWhere };
  if (isStaff) {
    if (employeeId) where = { ...where, employeeId };
  } else {
    const ownId = await resolveEmployeeId(session);
    where = { ...where, employeeId: ownId ?? 'none' };
  }

  const [items, total] = await Promise.all([
    db.attendance.findMany({
      where,
      orderBy: { [SORT[p.sortBy.toLowerCase()] ?? 'date']: p.sortDir },
      skip: p.skip,
      take: p.take,
      include: { employee: { select: { id: true, name: true, employeeCode: true } } },
    }),
    db.attendance.count({ where }),
  ]);
  return ok(paginated(items, total, p));
});

const createSchema = z.object({
  employeeId: z.string().min(1, 'employeeId is required'),
  date: z.string().regex(DATE_RE, 'date must be in YYYY-MM-DD format'),
  status: z.enum(ATTENDANCE_STATUSES),
  checkIn: z.string().regex(TIME_RE, 'checkIn must be HH:mm').nullish(),
  checkOut: z.string().regex(TIME_RE, 'checkOut must be HH:mm').nullish(),
  note: z.string().trim().max(500).nullish(),
});

function computeWorkHours(dateStr: string, checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  let ms = combineDateTime(dateStr, checkOut).getTime() - combineDateTime(dateStr, checkIn).getTime();
  if (ms < 0) ms += 24 * 3600 * 1000; // overnight shift
  return Math.round((ms / 3600000) * 100) / 100;
}

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const body = await parseBody(req, createSchema);

  const employee = await db.employee.findUnique({ where: { id: body.employeeId }, select: { id: true, name: true } });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);

  const date = utcDateOnly(new Date(`${body.date}T00:00:00.000Z`));
  const duplicate = await db.attendance.findUnique({
    where: { employeeId_date: { employeeId: body.employeeId, date } },
    select: { id: true },
  });
  if (duplicate) throw new ApiError('DUPLICATE_ATTENDANCE', 'Attendance already exists for this employee and date', 409);

  const workHours = computeWorkHours(body.date, body.checkIn ?? null, body.checkOut ?? null);
  const record = await db.attendance.create({
    data: {
      employeeId: body.employeeId,
      date,
      status: body.status,
      checkIn: body.checkIn ? combineDateTime(body.date, body.checkIn) : null,
      checkOut: body.checkOut ? combineDateTime(body.date, body.checkOut) : null,
      workHours,
      note: body.note ?? null,
      createdById: session.sub,
    },
    include: { employee: { select: { id: true, name: true, employeeCode: true } } },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'ATTENDANCE_RECORDED',
    entityType: 'ATTENDANCE',
    entityId: record.id,
    details: { employeeCode: record.employee.employeeCode, date: body.date, status: body.status },
    ip: clientIp(req),
  });
  return ok(record, 201);
});
