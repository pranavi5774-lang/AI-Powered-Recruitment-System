// PATCH /api/attendance/[id] — correct an attendance record (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { ATTENDANCE_STATUSES } from '@/lib/constants';
import { combineDateTime } from '@/lib/datetime';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const patchSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  checkIn: z.string().regex(TIME_RE, 'checkIn must be HH:mm').nullish(),
  checkOut: z.string().regex(TIME_RE, 'checkOut must be HH:mm').nullish(),
  note: z.string().trim().max(500).nullish(),
});

function combine(date: Date, time: string): Date {
  const dateStr = date.toISOString().slice(0, 10);
  return combineDateTime(dateStr, time);
}

function computeWorkHours(date: Date, checkIn: Date | null, checkOut: Date | null): number | null {
  if (!checkIn || !checkOut) return null;
  let ms = checkOut.getTime() - checkIn.getTime();
  if (ms < 0) ms += 24 * 3600 * 1000;
  return Math.round((ms / 3600000) * 100) / 100;
}

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const { id } = await ctx.params;
  const body = await parseBody(req, patchSchema);

  const record = await db.attendance.findUnique({ where: { id } });
  if (!record) throw new ApiError('ATTENDANCE_NOT_FOUND', 'Attendance record not found', 404);

  const checkIn =
    body.checkIn === undefined ? record.checkIn : body.checkIn === null ? null : combine(record.date, body.checkIn);
  const checkOut =
    body.checkOut === undefined ? record.checkOut : body.checkOut === null ? null : combine(record.date, body.checkOut);

  const updated = await db.attendance.update({
    where: { id },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      checkIn,
      checkOut,
      workHours: computeWorkHours(record.date, checkIn, checkOut),
      ...(body.note !== undefined ? { note: body.note ?? null } : {}),
      updatedById: session.sub,
    },
    include: { employee: { select: { id: true, name: true, employeeCode: true } } },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'ATTENDANCE_CORRECTED',
    entityType: 'ATTENDANCE',
    entityId: id,
    details: { changes: Object.keys(body), date: record.date.toISOString().slice(0, 10) },
    ip: clientIp(req),
  });
  return ok(updated);
});
