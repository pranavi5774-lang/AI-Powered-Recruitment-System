// GET  /api/leaves/types — leave types (any authenticated)
// POST /api/leaves/types — create leave type (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';

export const GET = handler(async (req) => {
  await requireAuth(req);
  const types = await db.leaveType.findMany({ orderBy: { name: 'asc' } });
  return ok({ items: types });
});

const createSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  annualQuota: z.coerce.number().min(0.5, 'Annual quota must be at least 0.5').max(365),
  description: z.string().trim().max(500).optional(),
});

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const body = await parseBody(req, createSchema);

  const existing = await db.leaveType.findUnique({ where: { name: body.name } });
  if (existing) throw new ApiError('LEAVE_TYPE_EXISTS', 'A leave type with this name already exists', 409);

  const leaveType = await db.leaveType.create({
    data: { name: body.name, annualQuota: body.annualQuota, description: body.description ?? null },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'LEAVE_TYPE_CREATED',
    entityType: 'LEAVE',
    entityId: leaveType.id,
    details: { name: leaveType.name, annualQuota: leaveType.annualQuota },
    ip: clientIp(req),
  });
  return ok(leaveType, 201);
});
