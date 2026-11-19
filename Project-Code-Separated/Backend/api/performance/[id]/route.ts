// PATCH /api/performance/[id] — update review (HR/ADMIN or the authoring reviewer)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { isValidDateString, parseFlexibleDate } from '@/lib/datetime';

const patchSchema = z.object({
  period: z.string().trim().min(3).max(40).optional(),
  reviewDate: z.string().refine(isValidDateString, 'reviewDate must be a valid date').optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  goals: z.string().trim().min(3).max(3000).optional(),
  achievements: z.string().trim().min(3).max(3000).optional(),
  feedback: z.string().trim().min(3).max(4000).optional(),
  strengths: z.string().trim().max(2000).nullish(),
  areasToImprove: z.string().trim().max(2000).nullish(),
});

export const PATCH = handler(async (req, ctx) => {
  const session = await requireAuth(req);
  const { id } = await ctx.params;
  const body = await parseBody(req, patchSchema);

  const review = await db.performanceReview.findUnique({ where: { id } });
  if (!review) throw new ApiError('REVIEW_NOT_FOUND', 'Performance review not found', 404);

  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  if (!isStaff && review.reviewerId !== session.sub) {
    throw new ApiError('FORBIDDEN', 'Only HR/ADMIN or the original reviewer can update this review', 403);
  }

  const updated = await db.performanceReview.update({
    where: { id },
    data: {
      ...(body.period !== undefined ? { period: body.period } : {}),
      ...(body.reviewDate !== undefined ? { reviewDate: parseFlexibleDate(body.reviewDate) } : {}),
      ...(body.rating !== undefined ? { rating: body.rating } : {}),
      ...(body.goals !== undefined ? { goals: body.goals } : {}),
      ...(body.achievements !== undefined ? { achievements: body.achievements } : {}),
      ...(body.feedback !== undefined ? { feedback: body.feedback } : {}),
      ...(body.strengths !== undefined ? { strengths: body.strengths ?? null } : {}),
      ...(body.areasToImprove !== undefined ? { areasToImprove: body.areasToImprove ?? null } : {}),
    },
    include: { employee: { select: { id: true, name: true, employeeCode: true } } },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'PERFORMANCE_REVIEW_UPDATED',
    entityType: 'PERFORMANCE',
    entityId: id,
    details: { changes: Object.keys(body) },
    ip: clientIp(req),
  });
  return ok(updated);
});
