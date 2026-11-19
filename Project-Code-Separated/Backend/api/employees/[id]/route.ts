// GET /api/employees/[id] — employee detail (HR/ADMIN or the linked employee)
// PATCH /api/employees/[id] — update employee (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { EMPLOYEE_STATUS } from '@/lib/constants';
import { isValidDateString, parseFlexibleDate } from '@/lib/datetime';

export const GET = handler(async (req, ctx) => {
  const session = await requireAuth(req);
  const { id } = await ctx.params;

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      leaveBalances: { include: { leaveType: { select: { id: true, name: true } } } },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);

  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  if (!isStaff && employee.userId !== session.sub) {
    throw new ApiError('FORBIDDEN', 'You can only view your own employee record', 403);
  }
  return ok(employee);
});

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  workEmail: z.email().max(160).optional(),
  phone: z.string().trim().max(24).nullish(),
  departmentId: z.string().min(1).nullish(),
  designation: z.string().trim().min(2).max(120).optional(),
  joiningDate: z.string().refine(isValidDateString, 'joiningDate must be a valid date').optional(),
  status: z.enum(EMPLOYEE_STATUS).optional(),
  address: z.string().trim().max(300).nullish(),
  emergencyContact: z.string().trim().max(120).nullish(),
});

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const { id } = await ctx.params;
  const body = await parseBody(req, patchSchema);

  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);

  if (body.departmentId) {
    const dept = await db.department.findUnique({ where: { id: body.departmentId }, select: { id: true } });
    if (!dept) throw new ApiError('INVALID_DEPARTMENT', 'Department not found', 400);
  }
  if (body.workEmail) {
    const email = body.workEmail.trim().toLowerCase();
    const taken = await db.employee.findFirst({ where: { workEmail: email, NOT: { id } }, select: { id: true } });
    if (taken) throw new ApiError('EMAIL_EXISTS', 'Another employee already uses this work email', 409);
  }

  const updated = await db.employee.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.workEmail !== undefined ? { workEmail: body.workEmail.trim().toLowerCase() } : {}),
      ...(body.phone !== undefined ? { phone: body.phone ?? null } : {}),
      ...(body.departmentId !== undefined ? { departmentId: body.departmentId ?? null } : {}),
      ...(body.designation !== undefined ? { designation: body.designation } : {}),
      ...(body.joiningDate !== undefined ? { joiningDate: parseFlexibleDate(body.joiningDate) } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.address !== undefined ? { address: body.address ?? null } : {}),
      ...(body.emergencyContact !== undefined ? { emergencyContact: body.emergencyContact ?? null } : {}),
    },
    include: { department: { select: { id: true, name: true } } },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'EMPLOYEE_UPDATED',
    entityType: 'EMPLOYEE',
    entityId: id,
    details: { changes: Object.keys(body) },
    ip: clientIp(req),
  });
  return ok(updated);
});
