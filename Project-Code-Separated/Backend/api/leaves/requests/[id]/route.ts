// PATCH /api/leaves/requests/[id] — approve/reject/cancel (HR/ADMIN; employee may cancel own PENDING)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, logAudit, notify, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { LEAVE_STATUSES } from '@/lib/constants';
import { utcDateOnly } from '@/lib/datetime';

const patchSchema = z.object({
  status: z.enum(LEAVE_STATUSES),
  reviewNote: z.string().trim().max(1000).optional(),
});

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAuth(req, ['EMPLOYEE', 'HR', 'ADMIN']);
  const { id } = await ctx.params;
  const body = await parseBody(req, patchSchema);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';

  const request = await db.leaveRequest.findUnique({
    where: { id },
    include: {
      leaveType: { select: { id: true, name: true, annualQuota: true } },
      employee: { select: { id: true, name: true, userId: true } },
    },
  });
  if (!request) throw new ApiError('LEAVE_REQUEST_NOT_FOUND', 'Leave request not found', 404);

  // ---- role rules: employees can only CANCEL their own PENDING request ----
  if (!isStaff) {
    const own = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
    if (!own || own.id !== request.employeeId) {
      throw new ApiError('FORBIDDEN', 'You can only manage your own leave requests', 403);
    }
    if (body.status !== 'CANCELLED') {
      throw new ApiError('FORBIDDEN', 'Employees can only cancel their own pending requests — approvals are an HR action', 403);
    }
    if (request.status !== 'PENDING') {
      throw new ApiError('INVALID_TRANSITION', 'Only pending requests can be cancelled', 400);
    }
  }

  if (request.status === 'APPROVED' && body.status !== 'APPROVED') {
    throw new ApiError('INVALID_TRANSITION', 'Approved leaves cannot be re-decided; cancel via a new request', 400);
  }
  if (['REJECTED', 'CANCELLED'].includes(request.status)) {
    throw new ApiError('INVALID_TRANSITION', `Request is already ${request.status}`, 400);
  }

  const updated = await db.$transaction(async (tx) => {
    const req2 = await tx.leaveRequest.update({
      where: { id },
      data: {
        status: body.status,
        reviewedById: session.sub,
        reviewedByName: session.name,
        reviewedAt: new Date(),
        reviewNote: body.reviewNote ?? null,
      },
    });
    if (body.status === 'APPROVED') {
      const year = request.startDate.getUTCFullYear();
      await tx.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year } },
        create: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year, quota: request.leaveType.annualQuota, used: request.days },
        update: { used: { increment: request.days } },
      });
    }
    return req2;
  });

  // Best-effort: create LEAVE attendance rows for approved range (skip existing)
  if (body.status === 'APPROVED') {
    const start = utcDateOnly(request.startDate);
    const end = utcDateOnly(request.endDate);
    for (let d = new Date(start); d <= end && d <= new Date(start.getTime() + 30 * 86_400_000); d = new Date(d.getTime() + 86_400_000)) {
      try {
        const existing = await db.attendance.findUnique({
          where: { employeeId_date: { employeeId: request.employeeId, date: d } },
          select: { id: true },
        });
        if (!existing) {
          await db.attendance.create({
            data: {
              employeeId: request.employeeId,
              date: d,
              status: 'LEAVE',
              note: `Approved leave: ${request.leaveType.name}`,
            },
          });
        }
      } catch (err) {
        console.error('[LEAVE] Failed to create attendance row', err instanceof Error ? err.message : err);
      }
    }
  }

  if (request.employee.userId) {
    await notify(
      request.employee.userId,
      'Leave request ' + body.status.toLowerCase(),
      `Your ${request.leaveType.name} request (${request.days} day(s)) was ${body.status.toLowerCase()} by ${session.name}.`,
      'LEAVE_UPDATE',
      '#/employee/leaves'
    );
  }
  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'LEAVE_DECISION',
    entityType: 'LEAVE',
    entityId: id,
    details: { from: request.status, to: body.status, days: request.days, reviewNote: body.reviewNote ?? null },
    ip: clientIp(req),
  });

  return ok(updated);
});
