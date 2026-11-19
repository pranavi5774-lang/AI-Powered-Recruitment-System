// POST /api/employees/hire/[applicationId] — convert a HIRED application into an
// employee record. IDEMPOTENT: re-running returns the existing employee (200).

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { ok, handler, requireAuth, parseBody, logAudit, notify, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { isValidDateString, parseFlexibleDate } from '@/lib/datetime';

const schema = z.object({
  departmentId: z.string().min(1).nullish(),
  designation: z.string().trim().min(2).max(120),
  joiningDate: z.string().refine(isValidDateString, 'joiningDate must be a valid date').optional(),
  workEmail: z.email().max(160).optional(),
});

async function nextEmployeeCode(): Promise<string> {
  const last = await db.employee.findFirst({ orderBy: { employeeCode: 'desc' }, select: { employeeCode: true } });
  const lastNum = last ? parseInt(last.employeeCode.replace(/\D/g, ''), 10) || 0 : 0;
  return `HS-EMP-${String(lastNum + 1).padStart(4, '0')}`;
}

export const POST = handler(async (req, ctx) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const { applicationId } = await ctx.params;
  const body = await parseBody(req, schema);

  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      job: { select: { title: true } },
      candidate: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!application) throw new ApiError('APPLICATION_NOT_FOUND', 'Application not found', 404);
  if (application.status !== 'HIRED') {
    throw new ApiError('NOT_HIRED', 'Employee records can only be created for applications with HIRED status', 400);
  }

  if (body.departmentId) {
    const dept = await db.department.findUnique({ where: { id: body.departmentId }, select: { id: true } });
    if (!dept) throw new ApiError('INVALID_DEPARTMENT', 'Department not found', 400);
  }

  // Idempotency fast-path
  const already = await db.employee.findUnique({ where: { sourceApplicationId: applicationId } });
  if (already) {
    return ok({ alreadyCreated: true, employee: already });
  }

  const candidateUser = application.candidate.user;
  const workEmail = (body.workEmail ?? candidateUser.email).trim().toLowerCase();
  const joiningDate = body.joiningDate ? parseFlexibleDate(body.joiningDate) : new Date();
  const year = new Date().getUTCFullYear();

  let employee: Awaited<ReturnType<typeof db.employee.create>>;
  try {
    employee = await db.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          employeeCode: await nextEmployeeCode(),
          name: candidateUser.name,
          workEmail,
          departmentId: body.departmentId ?? null,
          designation: body.designation,
          joiningDate,
          status: 'ACTIVE',
          userId: candidateUser.id,
          sourceApplicationId: applicationId,
          createdById: session.sub,
        },
      });
      // Leave balances for the current year from all leave types
      const leaveTypes = await tx.leaveType.findMany();
      if (leaveTypes.length > 0) {
        await tx.leaveBalance.createMany({
          data: leaveTypes.map((lt) => ({
            employeeId: created.id,
            leaveTypeId: lt.id,
            year,
            quota: lt.annualQuota,
            used: 0,
          })),
        });
      }
      // Upgrade the candidate's login to EMPLOYEE so they get the portal
      await tx.user.update({ where: { id: candidateUser.id }, data: { role: 'EMPLOYEE' } });
      return created;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Unique violation — concurrent hire (idempotent) or work email conflict
      const existing = await db.employee.findUnique({ where: { sourceApplicationId: applicationId } });
      if (existing) return ok({ alreadyCreated: true, employee: existing });
      throw new ApiError('EMAIL_EXISTS', 'An employee with this work email already exists', 409);
    }
    throw err;
  }

  await notify(
    candidateUser.id,
    'Welcome to the team! 🎉',
    `Your employee record ${employee.employeeCode} is active. Explore your employee portal.`,
    'HR_ACTION',
    '#/employee/dashboard'
  );
  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'EMPLOYEE_CREATED_FROM_HIRE',
    entityType: 'EMPLOYEE',
    entityId: employee.id,
    details: { applicationId, employeeCode: employee.employeeCode, jobTitle: application.job.title },
    ip: clientIp(req),
  });

  const full = await db.employee.findUnique({
    where: { id: employee.id },
    include: { department: { select: { id: true, name: true } } },
  });
  return ok({ alreadyCreated: false, employee: full ?? employee }, 201);
});
