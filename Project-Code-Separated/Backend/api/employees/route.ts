// GET  /api/employees — list employees (HR/ADMIN)
// POST /api/employees — create employee (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, getPagination, paginated, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { EMPLOYEE_STATUS } from '@/lib/constants';
import { isValidDateString, parseFlexibleDate } from '@/lib/datetime';

const SORT: Record<string, string> = {
  employeecode: 'employeeCode',
  name: 'name',
  joiningdate: 'joiningDate',
  status: 'status',
  createdat: 'createdAt',
};

export const GET = handler(async (req) => {
  await requireAuth(req, ['HR', 'ADMIN']);
  const p = getPagination(req);
  const sp = req.nextUrl.searchParams;
  const departmentId = sp.get('departmentId') ?? undefined;
  const status = sp.get('status') ?? undefined;
  if (status && !EMPLOYEE_STATUS.includes(status as never)) {
    throw new ApiError('INVALID_STATUS', 'Invalid employee status filter', 400);
  }

  const where = {
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
    ...(p.search
      ? {
          OR: [
            { name: { contains: p.search } },
            { employeeCode: { contains: p.search } },
            { workEmail: { contains: p.search } },
            { designation: { contains: p.search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.employee.findMany({
      where,
      orderBy: { [SORT[p.sortBy.toLowerCase()] ?? 'createdAt']: p.sortDir },
      skip: p.skip,
      take: p.take,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { attendance: true, leaveRequests: true, reviews: true } },
      },
    }),
    db.employee.count({ where }),
  ]);
  return ok(paginated(items, total, p));
});

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  workEmail: z.email().max(160),
  phone: z.string().trim().max(24).optional(),
  departmentId: z.string().min(1).nullish(),
  designation: z.string().trim().min(2).max(120),
  joiningDate: z.string().refine(isValidDateString, 'joiningDate must be a valid date'),
  status: z.enum(EMPLOYEE_STATUS).default('ACTIVE'),
  address: z.string().trim().max(300).optional(),
  emergencyContact: z.string().trim().max(120).optional(),
  userId: z.string().min(1).nullish(),
  sourceApplicationId: z.string().min(1).nullish(),
});

async function nextEmployeeCode(): Promise<string> {
  const last = await db.employee.findFirst({ orderBy: { employeeCode: 'desc' }, select: { employeeCode: true } });
  const lastNum = last ? parseInt(last.employeeCode.replace(/\D/g, ''), 10) || 0 : 0;
  return `HS-EMP-${String(lastNum + 1).padStart(4, '0')}`;
}

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const body = await parseBody(req, createSchema);

  if (body.departmentId) {
    const dept = await db.department.findUnique({ where: { id: body.departmentId }, select: { id: true } });
    if (!dept) throw new ApiError('INVALID_DEPARTMENT', 'Department not found', 400);
  }
  if (body.userId) {
    const linked = await db.user.findUnique({ where: { id: body.userId }, select: { id: true } });
    if (!linked) throw new ApiError('INVALID_USER', 'Linked user account not found', 400);
  }

  const email = body.workEmail.trim().toLowerCase();
  const emailTaken = await db.employee.findUnique({ where: { workEmail: email }, select: { id: true } });
  if (emailTaken) throw new ApiError('EMAIL_EXISTS', 'An employee with this work email already exists', 409);

  const employee = await db.employee.create({
    data: {
      employeeCode: await nextEmployeeCode(),
      name: body.name,
      workEmail: email,
      phone: body.phone ?? null,
      departmentId: body.departmentId ?? null,
      designation: body.designation,
      joiningDate: parseFlexibleDate(body.joiningDate),
      status: body.status,
      address: body.address ?? null,
      emergencyContact: body.emergencyContact ?? null,
      userId: body.userId ?? null,
      sourceApplicationId: body.sourceApplicationId ?? null,
      createdById: session.sub,
    },
    include: { department: { select: { id: true, name: true } } },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'EMPLOYEE_CREATED',
    entityType: 'EMPLOYEE',
    entityId: employee.id,
    details: { employeeCode: employee.employeeCode, name: employee.name },
    ip: clientIp(req),
  });
  return ok(employee, 201);
});
