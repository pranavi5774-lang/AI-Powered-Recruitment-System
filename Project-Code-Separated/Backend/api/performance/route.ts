// GET  /api/performance — reviews (HR/ADMIN all/filtered; EMPLOYEE own)
// POST /api/performance — create review (HR/ADMIN)

export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { ok, handler, requireAuth, parseBody, getPagination, paginated, logAudit, ApiError, clientIp } from '@/lib/api';
import { db } from '@/lib/db';
import { isValidDateString, parseFlexibleDate } from '@/lib/datetime';

const SORT: Record<string, string> = { reviewdate: 'reviewDate', rating: 'rating', createdat: 'createdAt' };

export const GET = handler(async (req) => {
  const session = await requireAuth(req);
  const isStaff = session.role === 'HR' || session.role === 'ADMIN';
  const p = getPagination(req);
  const employeeIdParam = req.nextUrl.searchParams.get('employeeId') ?? undefined;
  if (!isStaff && employeeIdParam) {
    throw new ApiError('FORBIDDEN', 'Employees can only view their own reviews', 403);
  }

  let where: Record<string, unknown> = {};
  if (isStaff) {
    if (employeeIdParam) where = { employeeId: employeeIdParam };
  } else {
    const own = await db.employee.findUnique({ where: { userId: session.sub }, select: { id: true } });
    where = { employeeId: own?.id ?? 'none' };
  }

  const [items, total] = await Promise.all([
    db.performanceReview.findMany({
      where,
      orderBy: { [SORT[p.sortBy.toLowerCase()] ?? 'reviewDate']: p.sortDir },
      skip: p.skip,
      take: p.take,
      include: { employee: { select: { id: true, name: true, employeeCode: true } } },
    }),
    db.performanceReview.count({ where }),
  ]);
  return ok(paginated(items, total, p));
});

const createSchema = z.object({
  employeeId: z.string().min(1, 'employeeId is required'),
  period: z.string().trim().min(3, 'Period is required (e.g. 2025-H1)').max(40),
  reviewDate: z.string().refine(isValidDateString, 'reviewDate must be a valid date'),
  rating: z.coerce.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  goals: z.string().trim().min(3).max(3000),
  achievements: z.string().trim().min(3).max(3000),
  feedback: z.string().trim().min(3).max(4000),
  strengths: z.string().trim().max(2000).optional(),
  areasToImprove: z.string().trim().max(2000).optional(),
});

export const POST = handler(async (req) => {
  const session = await requireAuth(req, ['HR', 'ADMIN']);
  const body = await parseBody(req, createSchema);

  const employee = await db.employee.findUnique({ where: { id: body.employeeId }, select: { id: true, name: true } });
  if (!employee) throw new ApiError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);

  const review = await db.performanceReview.create({
    data: {
      employeeId: body.employeeId,
      reviewerId: session.sub,
      reviewerName: session.name,
      period: body.period,
      reviewDate: parseFlexibleDate(body.reviewDate),
      rating: body.rating,
      goals: body.goals,
      achievements: body.achievements,
      feedback: body.feedback,
      strengths: body.strengths ?? null,
      areasToImprove: body.areasToImprove ?? null,
    },
    include: { employee: { select: { id: true, name: true, employeeCode: true } } },
  });

  await logAudit({
    actor: { id: session.sub, name: session.name, role: session.role },
    action: 'PERFORMANCE_REVIEW_CREATED',
    entityType: 'PERFORMANCE',
    entityId: review.id,
    details: { employeeId: body.employeeId, period: body.period, rating: body.rating },
    ip: clientIp(req),
  });
  return ok(review, 201);
});
